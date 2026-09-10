#!/usr/bin/env python3
"""Adapted ingest locator for this drop: use the prop sheet's OWN coordinates as placement,
instead of ingest-art.py's design-vs-background diff.

Why the standard locator doesn't apply here (see docs/rose-horizon-art/, spec/background.md):
1. Our section-spec bakes placeholder TEXT into design.png (real names/date/RSVP form copy —
   representative for human approval, per section-spec-task-body.md's own convention), which
   background.png never has. Diffing the two therefore flags every text block as a candidate
   "prop region" alongside the real decorative props (measured: 12-16 regions found for 2-4
   actual sheet props).
2. assign()'s bg-diff pairing in ingest-art.py has NO confidence floor (MIN_CONFIDENCE only
   gates the full-design-search fallback) — it greedily accepts whatever scores best among the
   contaminated candidates. Measured scores of 0.06-0.34 on this run, all silently accepted as
   matched:true. Visual reassembly (reassemble.py) confirmed real misplacement: RSVP's envelope
   landed mid-canvas instead of near the top; welcome's arch was crammed into a small wrong box.
3. Verified alternative: this drop's props.png is not a "shopping list" sheet (ingest-art.py's
   documented assumption) — each prop already sits at roughly its own final position on the
   sheet. Measured on rsvp: cream rose at (23.8%, 15.1%) vs. top-left in the real design,
   envelope at (51.6%, 34.8%) vs. upper-center, blush rose at (70.5%, 85.8%) vs. bottom-right —
   all correct by inspection. So the sheet's own alpha bounding box IS the placement; no
   diffing needed.

This reuses split_sheet's grouping approach (alpha-dilate-then-label) directly, not
reimplemented independently.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

MIN_PROP_PX = 400


def split_sheet(sheet_path, group_gap=None):
    sheet = Image.open(sheet_path).convert("RGBA")
    a = np.asarray(sheet)[:, :, 3]
    solid = a > 16
    if group_gap is None:
        group_gap = max(8, int(0.025 * min(sheet.width, sheet.height)))
    k = 2 * int(group_gap) + 1
    grouped = ndimage.binary_dilation(solid, np.ones((k, k)))
    lbl_g, n = ndimage.label(grouped)
    lbl = np.where(solid, lbl_g, 0)
    groups = []
    for i in range(1, n + 1):
        ys, xs = np.nonzero(lbl == i)
        if len(xs) < MIN_PROP_PX:
            continue
        x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
        crop = sheet.crop((x0, y0, x1, y1))
        m = (lbl[y0:y1, x0:x1] == i).astype(np.uint8) * 255
        arr = np.asarray(crop).copy()
        arr[:, :, 3] = np.minimum(arr[:, :, 3], m)
        groups.append((Image.fromarray(arr), (x0, y0, x1, y1)))
    groups.sort(key=lambda g: -(g[1][2] - g[1][0]) * (g[1][3] - g[1][1]))
    return groups, sheet.size


def main():
    section_dir = Path(sys.argv[1])
    out_dir = Path(sys.argv[2])
    names = [n.strip() for n in sys.argv[3].split(",") if n.strip()] if len(sys.argv) > 3 else []
    group_gap = int(sys.argv[4]) if len(sys.argv) > 4 else None

    groups, (cw, ch) = split_sheet(section_dir / "props.png", group_gap)
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"sheet {cw}x{ch} -> {len(groups)} group(s)")
    manifest = []
    for i, (crop, (x0, y0, x1, y1)) in enumerate(groups):
        name = names[i] if i < len(names) else f"prop-{i+1:02d}"
        crop.save(out_dir / f"{name}.webp", lossless=True)
        w, h = x1 - x0, y1 - y0
        manifest.append(dict(
            name=name, matched=True, via="sheet-position",
            box=[x0, y0, x1, y1], size=[w, h],
            pct=dict(x=round(100 * (x0 + w / 2) / cw, 2), y=round(100 * (y0 + h / 2) / ch, 2),
                      w=round(100 * w / cw, 2), h=round(100 * h / ch, 2)),
        ))
        print(f"  {name:<32} {w}x{h} at ({x0},{y0})  center {manifest[-1]['pct']['x']}%,{manifest[-1]['pct']['y']}%")

    Image.open(section_dir / "background.png").convert("RGB").save(out_dir / "background.webp", quality=92)

    json.dump(dict(section=section_dir.name, design_size=[cw, ch], props=manifest),
              open(out_dir / "manifest.json", "w"), indent=2)
    print(f"manifest written -> {out_dir / 'manifest.json'}")


if __name__ == "__main__":
    main()
