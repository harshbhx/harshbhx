# Photo treatments for the editorial hero. Pure PIL, no numpy.
#   python photo.py <avatar> <outdir>
# Writes matte.png (alpha), and variant JPEGs for review.
import sys, math, collections
from PIL import Image, ImageFilter

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
W, H = im.size
px = im.load()

def is_bg(c):
    r, g, b = c
    return min(r, g, b) >= 212 and max(r, g, b) - min(r, g, b) <= 16

# 1. flood fill the studio backdrop from top / left / right edges (not the bottom:
#    the white shirt reaches the bottom edge between the lapels)
bg = bytearray(W * H)
q = collections.deque()
for x in range(W):
    q.append((x, 0))
for y in range(H):
    q.append((0, y)); q.append((W - 1, y))
while q:
    x, y = q.popleft()
    i = y * W + x
    if bg[i] or not is_bg(px[x, y]):
        continue
    bg[i] = 1
    for nx, ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
        if 0 <= nx < W and 0 <= ny < H and not bg[ny*W+nx]:
            q.append((nx, ny))

# local backdrop colour: blur of the backdrop pixels only (handles the soft gradient)
BG = (240, 240, 241)
def dist(c, d=BG):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(c, d)))

# 2. soft alpha in a band around the boundary
alpha = [0.0 if bg[i] else 1.0 for i in range(W * H)]
band = set()
for y in range(H):
    for x in range(W):
        i = y * W + x
        if bg[i]:
            continue
        for dy in range(-2, 3):
            for dx in range(-2, 3):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and bg[ny * W + nx]:
                    band.add(i); break
            else:
                continue
            break
for i in band:
    x, y = i % W, i // W
    dref = 0
    for dy in range(-3, 4):
        for dx in range(-3, 4):
            nx, ny = x + dx, y + dy
            if 0 <= nx < W and 0 <= ny < H and not bg[ny * W + nx]:
                dref = max(dref, dist(px[nx, ny]))
    a = dist(px[x, y]) / max(dref, 40)
    alpha[i] = max(0.0, min(1.0, a * 1.15))

matte = Image.new('L', (W, H))
matte.putdata([int(a * 255) for a in alpha])
matte = matte.filter(ImageFilter.GaussianBlur(0.6))
matte.save(f'{out}/matte.png')
M = matte.load()

def hexrgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def backdrop(B, B2=None, name='x', vignette=True):
    """out = C + (1-a)(B' - BGlocal): keeps the photo's own backdrop shading."""
    B = hexrgb(B); B2 = hexrgb(B2) if B2 else B
    img = Image.new('RGB', (W, H)); o = img.load()
    cx, cy, R = W * 0.5, H * 0.32, W * 0.85
    for y in range(H):
        for x in range(W):
            c = px[x, y]; a = M[x, y] / 255
            t = min(1, math.hypot(x - cx, y - cy) / R) if vignette else 0
            b = tuple(B[k] + (B2[k] - B[k]) * t for k in range(3))
            o[x, y] = tuple(int(max(0, min(255, c[k] + (1 - a) * (b[k] - BG[k])))) for k in range(3))
    return img

def multiply(P, name):
    P = hexrgb(P)
    img = Image.new('RGB', (W, H)); o = img.load()
    for y in range(H):
        for x in range(W):
            c = px[x, y]
            o[x, y] = tuple(int(c[k] * P[k] / 255) for k in range(3))
    return img

variants = {
    'print-cream': multiply('#F7EFE2', 'print-cream'),
    'print-sand': multiply('#EFDCC2', 'print-sand'),
    'bd-sand': backdrop('#EAD3B5', '#D9BC98', 'bd-sand'),
    'bd-terracotta': backdrop('#D4825C', '#B4613D', 'bd-terracotta'),
    'bd-turmeric': backdrop('#EDBE5A', '#D9A23A', 'bd-turmeric'),
    'bd-clay-dark': backdrop('#5A3A2C', '#3A251C', 'bd-clay-dark'),
    'bd-espresso': backdrop('#3A2F28', '#231C17', 'bd-espresso'),
    'bd-peach': backdrop('#F2C6A8', '#E3A985', 'bd-peach'),
}
for k, v in variants.items():
    v.save(f'{out}/{k}.jpg', quality=90)
# contact sheet
sheet = Image.new('RGB', (W * 4 + 50, H * 2 + 30), (128, 128, 128))
for n, (k, v) in enumerate(variants.items()):
    sheet.paste(v, (10 + (n % 4) * (W + 10), 10 + (n // 4) * (H + 10)))
sheet.save(f'{out}/sheet.png')
print('ok', len(band))
