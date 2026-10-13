# Portrait plates for the profile: cut the photo out of its plain studio
# backdrop and set it on the terracotta plate used by the design.
#
#   python3 tools/plate.py <photo.jpg>
#
# Writes photos/portrait-light.jpg and photos/portrait-dark.jpg (4:5, 460×575).
# Needs Pillow and numpy. The backdrop is found by colour (low-saturation
# mid grey) and connectivity to the image border; edge pixels get a soft
# alpha and their grey cast is replaced by the new backdrop colour.

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

OUT = Path(__file__).resolve().parent.parent / 'photos'
SIZE = (460, 575)
PLATES = {  # radial: centre colour → edge colour (same as theme.plateBackdrop)
    'light': ('#D7855E', '#B9623D'),
    'dark': ('#C9764F', '#9C5232'),
}


def rgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32)


def main(src):
    im = Image.open(src).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    H, W, _ = a.shape
    mx, mn = a.max(2), a.min(2)
    lum = a.mean(2)

    # 1. candidate backdrop pixels: greyish and mid-bright
    cand = ((mx - mn) < 20) & (lum > 125) & (lum < 210)

    # 2. keep only candidates connected to the top / left / right borders
    #    (not the bottom: the suit reaches it)
    bg = np.zeros_like(cand)
    bg[0, :] = cand[0, :]
    bg[:, 0] = cand[:, 0]
    bg[:, -1] = cand[:, -1]
    while True:
        grown = bg.copy()
        grown[1:, :] |= bg[:-1, :]
        grown[:-1, :] |= bg[1:, :]
        grown[:, 1:] |= bg[:, :-1]
        grown[:, :-1] |= bg[:, 1:]
        grown &= cand
        if (grown == bg).all():
            break
        bg = grown

    # 3. smooth model of the original backdrop (quadratic fit over x, y)
    ys, xs = np.nonzero(bg)
    pick = np.random.default_rng(7).choice(len(xs), size=min(40000, len(xs)), replace=False)
    X, Y = xs[pick] / W, ys[pick] / H
    A = np.stack([np.ones_like(X), X, Y, X * X, Y * Y, X * Y], 1)
    coef = np.linalg.lstsq(A, a[ys[pick], xs[pick]], rcond=None)[0]
    gx, gy = np.meshgrid(np.arange(W) / W, np.arange(H) / H)
    G = np.stack([np.ones_like(gx), gx, gy, gx * gx, gy * gy, gx * gy], -1) @ coef

    # 4. alpha: 0 on the backdrop, 1 inside, soft across a thin edge band
    hard = Image.fromarray(((~bg) * 255).astype(np.uint8))
    inner = np.asarray(hard.filter(ImageFilter.MinFilter(5))) > 0
    outer = np.asarray(hard.filter(ImageFilter.MaxFilter(5))) > 0
    band = outer & ~inner
    dist = np.linalg.norm(a - G, axis=2)
    alpha = np.where(bg, 0.0, 1.0)
    alpha[band] = np.clip(dist[band] / 55.0, 0, 1)
    alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))) / 255.0

    for name, (c1, c2) in PLATES.items():
        B1, B2 = rgb(c1), rgb(c2)
        r = np.clip(np.hypot(gx - 0.5, gy - 0.32) / 0.85, 0, 1) ** 1.3
        plate = B1 + (B2 - B1) * r[..., None]
        # replace the old backdrop's colour contribution with the plate's
        out = a + (1 - alpha[..., None]) * (plate - G)
        img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
        # 4:5 crop keeping the hair, then the plate size
        ch = round(W * 5 / 4)
        top = max(0, min(H - ch, 20))
        img = img.crop((0, top, W, top + ch)).resize(SIZE, Image.LANCZOS)
        p = OUT / f'portrait-{name}.jpg'
        img.save(p, quality=84, optimize=True, progressive=False)
        print(p, img.size, p.stat().st_size, 'bytes')


if __name__ == '__main__':
    main(sys.argv[1])
