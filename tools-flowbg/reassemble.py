#!/usr/bin/env python3
"""Composite background + every matched cutout at its manifest box, for visual verification.

ingest-task-body.md: "The test is visual, not numeric: does the reassembly look like the
design the human approved? Report per-prop pass/fail. A file count is not evidence."
"""
import json
import sys
from PIL import Image

section_dir = sys.argv[1]
d = json.load(open(f"{section_dir}/manifest.json"))
bg = Image.open(f"{section_dir}/background.webp").convert("RGBA").resize(tuple(d["design_size"]))
canvas = bg.copy()
for p in d["props"]:
    if not p.get("matched"):
        continue
    cut = Image.open(f"{section_dir}/{p['name']}.webp").convert("RGBA")
    x0, y0, x1, y1 = p["box"]
    cut = cut.resize((x1 - x0, y1 - y0), Image.LANCZOS)
    canvas.alpha_composite(cut, (x0, y0))
out = f"{section_dir}/reassembly.png"
canvas.save(out)
print(out)
