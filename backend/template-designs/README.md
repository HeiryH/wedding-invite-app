# Shipped master designs

Template Studio exports a published design bundle. To validate and then bake one into this repository:

```sh
python3 scripts/bake-template-design.py /path/to/template-published.zip
python3 scripts/bake-template-design.py /path/to/template-published.zip --apply
```

The tool checks the Studio manifest, design checksum, template identity, complete cinematic
documents and all referenced uploaded assets before writing. It installs `<template-code>.json`
here and content-addressed artwork in `frontend/public/templates/<code>/studio-assets/`.
Artwork is also stored under `backend/template-designs/assets/` and embedded by the API, so
exporting a baked design later includes those assets even when no original upload exists.

The backend embeds these design files at build time and matches them to templates by code.
Rebuild the backend and frontend after applying a bundle. Runtime precedence is:

1. This repository's shipped design.
2. Published template defaults in the database.
3. Each client's own overrides.

Applying a bundle does not publish, clear database defaults, change clients, or deploy anything.
The separate sample-content document, including sample portraits and private wording, is excluded.
Uploaded image paths become template-owned static asset paths. Review the generated diff before
committing. Existing database defaults remain authoritative wherever they override the shipped file.
