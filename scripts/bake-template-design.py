#!/usr/bin/env python3
"""Validate a published Studio bundle; --apply installs its design and assets in the repository."""
import argparse
import hashlib
import json
import re
import stat
import sys
import zipfile
from pathlib import Path, PurePosixPath

UPLOAD = re.compile(r'''/uploads/[^\s"'()<>\\]+''')
SHIPPED = re.compile(r"/templates/[a-z0-9-]+/studio-assets/[a-f0-9]{64}\.[a-z0-9]+")
PROJECT = re.compile(r"^(ta?\d+\.layout\.cinematic-project)(?:\.\d+)?$")
CONTENT = {
    "invite.body", "walimah.body", "music.url", "people.primary.title", "people.primary.details",
    "people.secondary.title", "people.secondary.details", "people.honoree.title", "people.honoree.details",
}
EXTENSIONS = {".png", ".webp", ".jpg", ".jpeg", ".gif", ".svg", ".mp3", ".m4a", ".ogg", ".wav", ".mp4", ".webm"}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def utf16_length(text):
    return len(text.encode("utf-16-le", errors="surrogatepass")) // 2


def prepare(bundle_path):
    """Return the full write plan only after validating all documents and assets."""
    with zipfile.ZipFile(bundle_path) as archive:
        entries = archive.infolist()
        require(len(entries) <= 5000, "Too many entries in bundle.")
        require(sum(e.file_size for e in entries) <= 200 * 1024 * 1024, "Bundle exceeds 200 MB.")
        require(len({e.filename for e in entries}) == len(entries), "Duplicate archive paths.")
        for entry in entries:
            path = PurePosixPath(entry.filename)
            require(not path.is_absolute() and ".." not in path.parts and "\\" not in entry.filename, "Unsafe archive path.")
            require(not stat.S_ISLNK(entry.external_attr >> 16), "Symbolic links are not allowed.")
        design_bytes = archive.read("design.json")
        manifest = json.loads(archive.read("studio.json"))
        require(manifest.get("schemaVersion") == 1, "Unsupported Studio manifest.")
        require(manifest.get("designSha256") == hashlib.sha256(design_bytes).hexdigest(), "Design checksum does not match the Studio manifest.")
        bundle = json.loads(design_bytes)
        require(bundle.get("version") == 1, "Unsupported design bundle version.")
        templates = bundle.get("templates", [])
        require(len(templates) == 1, "Export exactly one template from Studio.")
        template = templates[0]
        code = template.get("templateCode", "")
        require(isinstance(code, str) and re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", code), "Invalid template code.")
        require(code == manifest.get("templateCode"), "Template identity does not match the manifest.")
        require(not template.get("isAuthored"), "Authored composition baking is not supported yet.")
        config = template.get("defaultConfig")
        require(isinstance(config, dict) and all(isinstance(k, str) and isinstance(v, str) for k, v in config.items()), "Invalid default configuration.")
        require(not CONTENT.intersection(config), "Bundle contains client/sample content. Publish it through Studio first.")

        # Reassemble transport chunks before rewriting any asset references.
        documents = dict(config)
        projects = {m.group(1) for key in config if (m := PROJECT.fullmatch(key))}
        for project in projects:
            require(project in config, "Cinematic manifest missing.")
            metadata = json.loads(config[project])
            count = metadata.get("chunks")
            require(isinstance(count, int) and 0 < count <= 1500, "Invalid cinematic chunk count.")
            require(all(f"{project}.{i}" in config for i in range(count)), "Cinematic chunk missing.")
            document = "".join(config[f"{project}.{i}"] for i in range(count))
            require(utf16_length(document) == metadata.get("length"), "Cinematic document length mismatch.")
            json.loads(document)
            for key in list(documents):
                if key == project or key.startswith(project + "."):
                    del documents[key]
            documents[project] = document

        thumbnail = template.get("thumbnailUrl", "")
        require(isinstance(thumbnail, str), "Invalid thumbnail URL.")
        references = set(UPLOAD.findall(thumbnail)) | set(SHIPPED.findall(thumbnail))
        for value in documents.values():
            references.update(UPLOAD.findall(value))
            references.update(SHIPPED.findall(value))
        replacements, writes = {}, {}
        for url in sorted(references):
            name = "assets" + url
            require(name in archive.namelist(), f"Missing asset in bundle: {url}")
            entry = archive.getinfo(name)
            require(entry.file_size <= 25 * 1024 * 1024, f"Asset exceeds 25 MB: {url}")
            suffix = PurePosixPath(url).suffix.lower()
            require(suffix in EXTENSIONS, f"Unsupported asset type: {url}")
            data = archive.read(name)
            filename = hashlib.sha256(data).hexdigest() + suffix
            replacements[url] = f"/templates/{code}/studio-assets/{filename}"
            writes[f"frontend/public/templates/{code}/studio-assets/{filename}"] = data
            # The API embeds the same asset so a subsequent export remains self-contained.
            writes[f"backend/template-designs/assets/{filename}"] = data

        def rewrite(value):
            return SHIPPED.sub(lambda match: replacements.get(match.group(0), match.group(0)),
                               UPLOAD.sub(lambda match: replacements[match.group(0)], value))

        baked = {}
        for key, value in documents.items():
            value = rewrite(value)
            if key in projects:
                # ASCII JSON makes chunk length identical in Python, JavaScript and .NET UTF-16.
                value = json.dumps(json.loads(value), ensure_ascii=True, separators=(",", ":"))
                chunks = [value[i:i + 3500] for i in range(0, len(value), 3500)]
                version = json.loads(config[key])["version"]
                baked[key] = json.dumps({"version": version, "chunks": len(chunks), "length": len(value)}, separators=(",", ":"))
                baked.update({f"{key}.{i}": chunk for i, chunk in enumerate(chunks)})
            else:
                baked[key] = value
        baseline = {
            "schemaVersion": 1, "templateCode": code,
            "publishedRevision": manifest.get("publishedRevision"),
            "sourceDesignSha256": manifest["designSha256"],
            "assets": sorted(set(replacements.values())),
            "thumbnailUrl": rewrite(thumbnail), "config": dict(sorted(baked.items())),
        }
        writes[f"backend/template-designs/{code}.json"] = (json.dumps(baseline, ensure_ascii=True, indent=2) + "\n").encode()
        return code, writes


def install(writes, root):
    root = root.resolve()
    # Validate every target before writing anything, including existing directory symlinks.
    for relative in writes:
        destination = (root / relative).resolve()
        require(destination.is_relative_to(root), "A target escapes the repository through a symbolic link.")
    for relative, data in writes.items():
        destination = root / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        temporary = destination.with_name(destination.name + ".studio-tmp")
        temporary.write_bytes(data)
        temporary.replace(destination)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("bundle", type=Path)
    parser.add_argument("--apply", action="store_true", help="Write the validated design and assets; otherwise validate only.")
    args = parser.parse_args()
    try:
        code, writes = prepare(args.bundle)
        if args.apply:
            install(writes, Path(__file__).resolve().parent.parent)
        print(f"{'Installed' if args.apply else 'Validated'} {code}: {len(writes)} repository files.")
        if not args.apply:
            print("No files changed. Add --apply to install this published design.")
    except (ValueError, KeyError, TypeError, zipfile.BadZipFile, OSError) as error:
        print(f"Cannot bake design: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
