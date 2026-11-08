import hashlib
import importlib.util
import io
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

spec = importlib.util.spec_from_file_location("baker", Path(__file__).with_name("bake-template-design.py"))
baker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(baker)


def bundle(config=None, assets=None, **overrides):
    template = {"templateCode": "roman-garden", "isAuthored": False, "thumbnailUrl": "", "defaultConfig": config or {}}
    template.update(overrides)
    design = json.dumps({"version": 1, "templates": [template]}).encode()
    manifest = {"schemaVersion": 1, "templateCode": "roman-garden", "publishedRevision": 2,
                "designSha256": hashlib.sha256(design).hexdigest()}
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("design.json", design)
        archive.writestr("studio.json", json.dumps(manifest))
        for name, content in (assets or {}).items():
            archive.writestr(name, content)
    buffer.seek(0)
    return buffer


class BakeTemplateDesignTests(unittest.TestCase):
    def test_assets_are_content_addressed_and_design_is_repository_owned(self):
        code, writes = baker.prepare(bundle({"image": "/uploads/63/flower.png"}, {"assets/uploads/63/flower.png": b"image"}))
        self.assertEqual(code, "roman-garden")
        design = json.loads(writes["backend/template-designs/roman-garden.json"])
        self.assertTrue(design["config"]["image"].startswith("/templates/roman-garden/studio-assets/"))
        self.assertEqual(design["publishedRevision"], 2)
        self.assertEqual(len(writes), 3)
        with tempfile.TemporaryDirectory() as directory:
            baker.install(writes, Path(directory))
            self.assertTrue((Path(directory) / "backend/template-designs/roman-garden.json").exists())

    def test_cinematic_rewriting_preserves_valid_complete_transport(self):
        text = json.dumps({"image": "/uploads/63/flower.png", "text": "🌸" * 2000}, ensure_ascii=False)
        project = "t15.layout.cinematic-project"
        config = {project: json.dumps({"version": 1, "chunks": 1, "length": baker.utf16_length(text)}), project + ".0": text}
        _, writes = baker.prepare(bundle(config, {"assets/uploads/63/flower.png": b"image"}))
        baked = json.loads(writes["backend/template-designs/roman-garden.json"])["config"]
        manifest = json.loads(baked[project])
        document = "".join(baked[f"{project}.{i}"] for i in range(manifest["chunks"]))
        self.assertEqual(baker.utf16_length(document), manifest["length"])
        self.assertEqual(json.loads(document)["text"], "🌸" * 2000)
        self.assertTrue(json.loads(document)["image"].startswith("/templates/"))
        self.assertNotIn("/uploads/", document)

    def test_an_already_baked_design_can_be_baked_again_with_all_assets(self):
        data = b"image"
        url = f"/templates/roman-garden/studio-assets/{hashlib.sha256(data).hexdigest()}.png"
        _, writes = baker.prepare(bundle({"image": url}, {"assets" + url: data}, thumbnailUrl=url))
        baseline = json.loads(writes['backend/template-designs/roman-garden.json'])
        self.assertEqual(baseline['config']['image'], url)
        self.assertEqual(baseline['assets'], [url])
        self.assertEqual(baseline['thumbnailUrl'], url)
        self.assertIn('backend/template-designs/assets/' + url.split('/')[-1], writes)

    def test_missing_asset_and_client_content_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "Missing asset"):
            baker.prepare(bundle({"image": "/uploads/missing.png"}))
        with self.assertRaisesRegex(ValueError, "client/sample"):
            baker.prepare(bundle({"invite.body": "Private client text"}))

    def test_unsafe_archives_and_authored_compositions_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "Unsafe archive"):
            baker.prepare(bundle(assets={"../escape": b"no"}))
        with self.assertRaisesRegex(ValueError, "Authored composition"):
            baker.prepare(bundle(isAuthored=True))

    def test_identity_checksum_and_incomplete_projects_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "identity"):
            baker.prepare(bundle(templateCode="other-template"))
        project = "t15.layout.cinematic-project"
        with self.assertRaisesRegex(ValueError, "chunk missing"):
            baker.prepare(bundle({project: json.dumps({"version": 1, "chunks": 1, "length": 2})}))
        archive = bundle()
        tampered = io.BytesIO()
        with zipfile.ZipFile(archive) as source, zipfile.ZipFile(tampered, "w") as target:
            target.writestr("design.json", b"{}")
            target.writestr("studio.json", source.read("studio.json"))
        tampered.seek(0)
        with self.assertRaisesRegex(ValueError, "checksum"):
            baker.prepare(tampered)

    def test_symlink_targets_cannot_escape_repository(self):
        with tempfile.TemporaryDirectory() as root, tempfile.TemporaryDirectory() as external:
            (Path(root) / "backend").symlink_to(external, target_is_directory=True)
            with self.assertRaisesRegex(ValueError, "symbolic link"):
                baker.install({"backend/template-designs/test.json": b"{}"}, Path(root))
            self.assertFalse((Path(external) / "template-designs/test.json").exists())


if __name__ == "__main__":
    unittest.main()
