#!/usr/bin/env python3
"""Generate the rose-horizon flow background: a soft, low-contrast blue wash that tiles
seamlessly on the vertical axis by construction.

Why code and not a generation call: this asset must be (a) perfectly tileable, (b) reliably
low-contrast so real text stays legible over any part of it at any scroll offset, and (c) on
the palette sampled from the reference. All three are guarantees here and none of them were
holdable across six generation attempts.

Seamlessness comes from building the noise in the frequency domain: an inverse FFT of a
low-passed random spectrum is periodic in both axes by definition. The domain warp that makes
the bands undulate is built from the same kind of periodic field and sampled with wraparound
indexing, so warping preserves the tiling guarantee rather than breaking it.

Bands run VERTICALLY, along the axis the reader swipes.
"""
import numpy as np
from PIL import Image

W, H = 1024, 2048
OUT = "/Users/helmyheiry/wedding-invite-app/.worktrees/rose-horizon-20260908/docs/rose-horizon-art"

# Palette sampled from the reference by sample-palette.py (spec/style.json)
POWDER = (0x9c, 0xc8, 0xd3)   # pale powder-blue sky
CORNF = (0x7c, 0xa3, 0xc0)    # mid cornflower-blue
MIST = (0xc7, 0xdd, 0xd7)     # hazy dusty blue-grey
CREAM = (0xfa, 0xeb, 0xcc)    # warm ivory cream — used only as a faint warm bloom


def periodic_noise(shape, scale, seed, stretch=1.0):
    """Smooth noise wrapping exactly in both axes (inverse FFT of a low-passed spectrum).

    stretch > 1 smooths along y, which elongates features VERTICALLY.
    """
    rng = np.random.default_rng(seed)
    h, w = shape
    spec = rng.normal(size=(h, w)) + 1j * rng.normal(size=(h, w))
    fy = np.fft.fftfreq(h)[:, None]
    fx = np.fft.fftfreq(w)[None, :]
    radius = np.sqrt((fy * stretch) ** 2 + (fx / stretch) ** 2)
    radius[0, 0] = 1e-6
    spec *= np.exp(-(radius * scale) ** 2)
    field = np.real(np.fft.ifft2(spec))
    field -= field.min()
    return field / (field.max() + 1e-9)


def warp(field, dx, dy):
    """Resample `field` at displaced coordinates, wrapping at every edge.

    Wraparound indexing is what keeps the warped result periodic — a warp that clamped or
    reflected at the edges would destroy the seam guarantee the FFT gives us.
    """
    h, w = field.shape
    yy, xx = np.meshgrid(np.arange(h), np.arange(w), indexing="ij")
    sy = (yy + dy).astype(np.int64) % h
    sx = (xx + dx).astype(np.int64) % w
    return field[sy, sx]


# --- the wash ---------------------------------------------------------------------
# Vertical current bands: strong smoothing along y, detail retained across x.
base = periodic_noise((H, W), scale=520, seed=11, stretch=3.2)
swirl = periodic_noise((H, W), scale=260, seed=27, stretch=2.2)
grain = periodic_noise((H, W), scale=1400, seed=43)

# --- make them wavy ---------------------------------------------------------------
# Undulation = a lateral displacement that varies down the image, so a band snakes instead
# of running straight. Two components: a couple of slow sine periods (readable, rhythmic)
# plus low-frequency noise (keeps it organic rather than mechanical). Both are periodic in
# y over exactly H, so the tile still wraps.
yy = np.arange(H)[:, None]
sine_wave = np.sin(2 * np.pi * 3 * yy / H) * 46 + np.sin(2 * np.pi * 7 * yy / H + 1.7) * 18
noise_wave = (periodic_noise((H, W), scale=420, seed=61, stretch=2.8) - 0.5) * 150

dx = sine_wave + noise_wave
base = warp(base, dx, 0)
swirl = warp(swirl, dx * 0.55, 0)

field = 0.62 * base + 0.38 * swirl

# Contrast: enough tonal movement to read as flowing, still compressed so text stays legible
field = 0.5 + (field - field.mean()) * 1.55
field = np.clip(field, 0, 1)


def ramp(t, c0, c1):
    t = t[..., None]
    return np.array(c0) * (1 - t) + np.array(c1) * t


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
Image.fromarray(img, "RGB").save(f"{OUT}/flowbg-tile.png")

# --- verification -----------------------------------------------------------------
a = img.astype(np.int16)
wrap_delta = np.abs(a[-1] - a[0]).mean()
interior = np.abs(a[1:] - a[:-1]).mean()
print(f"seam wrap delta   : {wrap_delta:.3f}")
print(f"interior row delta: {interior:.3f}")
print(f"=> seam is {'INDISTINGUISHABLE from' if wrap_delta <= interior * 1.5 else 'WORSE than'} a normal row step")

lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
print(f"luminance range   : {lum.min():.0f}-{lum.max():.0f} (spread {lum.max()-lum.min():.0f} of 255)")

Image.fromarray(np.vstack([img, img]), "RGB").save(f"{OUT}/flowbg-seamtest.png")
