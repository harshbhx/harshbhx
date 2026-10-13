# Compose the portrait plate: original photo + matte (from photo.py) over a
# terracotta studio backdrop, keeping the photo's own backdrop shading.
#   python portrait.py <avatar> <matte.png> <out.jpg> <colorTop> <colorEdge> [quality]
import sys, math
from PIL import Image
src, matte, out, c1, c2 = sys.argv[1:6]
q = int(sys.argv[6]) if len(sys.argv) > 6 else 84
im = Image.open(src).convert('RGB'); M = Image.open(matte).load(); px = im.load()
W, H = im.size
BG = (240, 240, 241)
h2 = lambda h: tuple(int(h.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
B1, B2 = h2(c1), h2(c2)
o = Image.new('RGB', (W, H)); op = o.load()
cx, cy, R = W * 0.5, H * 0.30, W * 0.80
for y in range(H):
    for x in range(W):
        c = px[x, y]; a = M[x, y] / 255
        t = min(1, math.hypot(x - cx, y - cy) / R) ** 1.3
        b = [B1[k] + (B2[k] - B1[k]) * t for k in range(3)]
        op[x, y] = tuple(int(max(0, min(255, c[k] + (1 - a) * (b[k] - BG[k])))) for k in range(3))
# 4:5 portrait crop centred on the face (face centre x ~ 230)
crop = o.crop((46, 0, 414, 460))
crop.save(out, quality=q, optimize=True, progressive=False)
print(out, crop.size)
