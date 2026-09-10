#!/usr/bin/env python3
"""Manual crop for walimah: extract at a small group-gap (genuinely separates wreath from
cream rose, unlike welcome's zero-gap fusion) then recombine wreath+star into one asset,
since 'Rose-wreathed crescent moon and star' is a single confirmed icon in spec/assets.json.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ART = Path("/Users/helmyheiry/wedding-invite-app/.worktrees/rose-horizon-20260908/docs/rose-horizon-art/walimah")
OUT = Path("/Users/helmyheiry/wedding-invite-app/.worktrees/rose-horizon-20260908/docs/rose-horizon-props/walimah")
OUT.mkdir(parents=True, exist_ok=True)

sheet = Image.open(ART / "props.png").convert("RGBA")
arr = np.asarray(sheet)
a = arr[:, :, 3]
solid = a > 16

GAP = 2  # small enough that wreath and cream rose stay genuinely separate (verified: 4 real
         # groups at gap<=12; only merges into fewer at gap>=16, which is a false fusion)
k = 2 * GAP + 1
grouped = ndimage.binary_dilation(solid, np.ones((k, k)))
lbl, n = ndimage.label(grouped)

groups = []
for i in range(1, n + 1):
    ys, xs = np.nonzero((lbl == i) & solid)
    if len(xs) < 400:
        continue
    box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    groups.append((box, lbl == i))

print(f"{len(groups)} raw groups at gap={GAP}:")
for (x0, y0, x1, y1), _ in groups:
    print(f"  ({x0},{y0})-({x1},{y1}) size {x1-x0}x{y1-y0}")

# Identify by box (measured earlier): wreath ~(220,469)-(857,1013), star ~(571,564)-(706,693),
# cream rose ~(40,860)-(489,1278), blue rose ~(549,208)-(970,617)
def closest(target):
    tx0, ty0, tx1, ty1 = target
    best = min(groups, key=lambda g: abs(g[0][0]-tx0)+abs(g[0][1]-ty0)+abs(g[0][2]-tx1)+abs(g[0][3]-ty1))
    return best

wreath = closest((220, 469, 857, 1013))
star = closest((571, 564, 706, 693))
cream_rose = closest((40, 860, 489, 1278))
blue_rose = closest((549, 208, 970, 617))

assert wreath != cream_rose and wreath != blue_rose, "wreath collided with a rose -- box matching failed"

def save_crop(mask_list, name):
    """Union one or more (box, mask) groups into a single cropped RGBA asset."""
    x0 = min(b[0] for b, _ in mask_list)
    y0 = min(b[1] for b, _ in mask_list)
    x1 = max(b[2] for b, _ in mask_list)
    y1 = max(b[3] for b, _ in mask_list)
    combined_mask = np.zeros(solid.shape, dtype=bool)
    for _, m in mask_list:
        combined_mask |= m
    crop_arr = arr[y0:y1, x0:x1].copy()
    crop_mask = combined_mask[y0:y1, x0:x1]
    crop_arr[:, :, 3] = np.where(crop_mask, crop_arr[:, :, 3], 0)
    out_path = OUT / f"{name}.webp"
    Image.fromarray(crop_arr, "RGBA").save(out_path, lossless=True)
    w, h = x1 - x0, y1 - y0
    cw, ch = solid.shape[1], solid.shape[0]
    pct = dict(x=round(100*(x0+w/2)/cw, 2), y=round(100*(y0+h/2)/ch, 2),
               w=round(100*w/cw, 2), h=round(100*h/ch, 2))
    print(f"saved {name}: ({x0},{y0})-({x1},{y1}) {w}x{h} pct={pct}")
    return dict(name=name, matched=True, via="manual-crop", box=[x0, y0, x1, y1], size=[w, h], pct=pct)

manifest_props = [
    save_crop([wreath, star], "Rose-wreathed crescent moon and star"),
    save_crop([cream_rose], "Cream rose bloom"),
    save_crop([blue_rose], "Dusty blue-grey rose bloom"),
]

Image.open(ART / "background.png").convert("RGB").save(OUT / "background.webp", quality=92)
json.dump(dict(section="walimah", design_size=[solid.shape[1], solid.shape[0]], props=manifest_props),
          open(OUT / "manifest.json", "w"), indent=2)
print("manifest written")
