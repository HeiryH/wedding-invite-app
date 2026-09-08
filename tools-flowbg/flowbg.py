#!/usr/bin/env python3
"""Generate the rose-horizon flow background: a soft, low-contrast blue wash that tiles
seamlessly on the vertical axis by construction.

Why code and not a generation call: this asset must be (a) perfectly tileable, (b) reliably
low-contrast so real text stays legible over any part of it at any scroll offset, and (c) on
the palette sampled from the reference. All three are guarantees here and none of them were
holdable across six generation attempts.

Seamlessness comes from building the noise in the frequency domain: an inverse FFT of a
low-passed random spectrum is periodic in both axes by definition, so the tile wraps exactly.
"""
import numpy as np
from PIL import Image

W, H = 1024, 2048

# Palette sampled from the reference by sample-palette.py (spec/style.json)
POWDER = (0x9c, 0xc8, 0xd3)   # pale powder-blue sky
CORNF = (0x7c, 0xa3, 0xc0)    # mid cornflower-blue
MIST = (0xc7, 0xdd, 0xd7)     # hazy dusty blue-grey
CREAM = (0xfa, 0xeb, 0xcc)    # warm ivory cream — used only as a faint warm bloom


def periodic_noise(shape, scale, seed, stretch=1.0):
    """Smooth noise that wraps exactly in both axes (inverse FFT of a low-passed spectrum).

    `stretch` > 1 elongates features horizontally, which is what turns round blobs into
    drifting current-like bands.
    """
    rng = np.random.default_rng(seed)
    h, w = shape
    spec = rng.normal(size=(h, w)) + 1j * rng.normal(size=(h, w))
    fy = np.fft.fftfreq(h)[:, None]
    fx = np.fft.fftfreq(w)[None, :]
    radius = np.sqrt((fy / stretch) ** 2 + (fx * stretch) ** 2)
    radius[0, 0] = 1e-6
    spec *= np.exp(-(radius * scale) ** 2)      # gaussian low-pass -> soft, cloudy shapes
    field = np.real(np.fft.ifft2(spec))
    field -= field.min()
    return field / (field.max() + 1e-9)


def ramp(t, c0, c1):
    t = t[..., None]
    return np.array(c0) * (1 - t) + np.array(c1) * t


# Large drifting current bands + a slower second octave + fine grain, all periodic.
# stretch>1 elongates horizontally so the wash reads as lateral drift, not blobs.
base = periodic_noise((H, W), scale=620, seed=11, stretch=2.6)
swirl = periodic_noise((H, W), scale=300, seed=27, stretch=1.9)
grain = periodic_noise((H, W), scale=1400, seed=43)

field = 0.62 * base + 0.38 * swirl

# Contrast: enough tonal movement to read as flowing, still compressed so text stays legible
field = 0.5 + (field - field.mean()) * 1.55
field = np.clip(field, 0, 1)

img = ramp(field, CORNF, POWDER)

# Faint mist highlights in the upper-mid range, kept subtle
mist_mask = np.clip((field - 0.55) / 0.45, 0, 1) ** 1.5
img = img * (1 - mist_mask[..., None] * 0.45) + np.array(MIST) * (mist_mask[..., None] * 0.45)

# A barely-there warm bloom so it doesn't read as a flat blue slab
warm = np.clip((swirl - 0.72) / 0.28, 0, 1) ** 2
img = img * (1 - warm[..., None] * 0.14) + np.array(CREAM) * (warm[..., None] * 0.14)

# Gouache-ish grain
img += (grain[..., None] - 0.5) * 9.0

img = np.clip(img, 0, 255).astype(np.uint8)
out = Image.fromarray(img, "RGB")
out.save("/Users/helmyheiry/wedding-invite-app/.worktrees/rose-horizon-20260908/docs/rose-horizon-art/flowbg-tile.png")

# --- verification -------------------------------------------------------------
a = img.astype(np.int16)
wrap = np.abs(a[-1] - a[0]).mean()                     # last row vs first row (the seam)
interior = np.abs(a[1:] - a[:-1]).mean()               # mean adjacent-row difference
print(f"seam wrap delta   : {wrap:.3f}")
print(f"interior row delta: {interior:.3f}")
print(f"=> seam is {'INDISTINGUISHABLE from' if wrap <= interior * 1.5 else 'WORSE than'} a normal row step")

lum = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])
print(f"luminance range   : {lum.min():.0f}-{lum.max():.0f} (spread {lum.max()-lum.min():.0f} of 255)")

stack = np.vstack([img, img])
Image.fromarray(stack, "RGB").save("/Users/helmyheiry/wedding-invite-app/.worktrees/rose-horizon-20260908/docs/rose-horizon-art/flowbg-seamtest.png")
