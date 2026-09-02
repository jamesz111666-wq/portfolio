#!/usr/bin/env python3
"""Turn the white-backdrop headshot into a portrait that sits *in* a dark page.

Run: python3 tools/portrait.py [src.jpg] [out.png] [ground hex]
Defaults regenerate site/assets/james-portrait.png for the current theme.

The headshot was lit against a white studio backdrop, so every pixel along the
hair is a mix of hair and backdrop:  I = a*F + (1-a)*W  (W = white).  Cutting
such an edge with a hard mask leaves the grey remainder behind as a halo, which
is what a plain flood-fill cutout shows around the hair.  Instead we estimate a
per-pixel alpha from how much backdrop each edge pixel still carries, then solve
that equation for F — the white is subtracted out rather than clipped off.

Passes:
  1. flood fill from the border  -> which pixels are definitely backdrop
  2. matte the transition band   -> soft alpha + white-spill removal (the halo fix)
  3. shadow lift toward ground   -> dark clothing stops reading as a silhouette
  4. bottom fade                 -> shoulders dissolve instead of being cut off
"""
import sys
from collections import deque
from PIL import Image, ImageFilter

SRC = sys.argv[1] if len(sys.argv) > 1 else "assets/james-zhu.jpg"
DST = sys.argv[2] if len(sys.argv) > 2 else "assets/james-portrait.png"
GROUND = (sys.argv[3] if len(sys.argv) > 3 else "#13251E").lstrip("#")
gr = tuple(int(GROUND[i:i + 2], 16) for i in (0, 2, 4))

im = Image.open(SRC).convert("RGB")
w, h = im.size
px = im.load()

# ---- 1. locate the backdrop ---------------------------------------------
def is_bg(p):
    r, g, b = p
    return min(r, g, b) > 205 and (max(r, g, b) - min(r, g, b)) < 26

bg = bytearray(w * h)
q = deque()
def seed(x, y):
    if not bg[y * w + x] and is_bg(px[x, y]):
        bg[y * w + x] = 1
        q.append((x, y))

for x in range(w):
    seed(x, 0); seed(x, h - 1)
for y in range(h):
    seed(0, y); seed(w - 1, y)

while q:
    x, y = q.popleft()
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h:
            seed(nx, ny)

# ---- 2. matte the transition band ---------------------------------------
# Dilate the backdrop inward; the pixels it reaches are the contaminated rim.
BAND = 10
bgmask = Image.frombytes("L", (w, h), bytes(255 if v else 0 for v in bg))
band = bgmask.filter(ImageFilter.MaxFilter(BAND * 2 + 1))
bp = band.load()

HI, LO = 214, 120      # minRGB at pure backdrop / at solid foreground
GAMMA = 1.6            # >1 pushes light, backdrop-heavy strands further toward
                       # transparent, which is what kills the last of the halo
alpha = Image.new("L", (w, h), 255)
ap = alpha.load()

for y in range(h):
    row = y * w
    for x in range(w):
        if bg[row + x]:
            ap[x, y] = 0
            continue
        if not bp[x, y]:
            continue                      # interior: untouched, fully opaque
        r, g, b = px[x, y]
        m = min(r, g, b)
        if m <= LO:
            continue                      # solidly foreground
        a = 0.0 if m >= HI else ((HI - m) / (HI - LO)) ** GAMMA
        ap[x, y] = int(a * 255)
        if a > 0.02:
            # unpremultiply against white: F = (I - (1-a)*255) / a
            inv = (1.0 - a) * 255.0
            px[x, y] = (
                max(0, min(255, int((r - inv) / a))),
                max(0, min(255, int((g - inv) / a))),
                max(0, min(255, int((b - inv) / a))),
            )

alpha = alpha.filter(ImageFilter.GaussianBlur(0.7))   # just enough to de-jag

# ---- 3. shadow lift ------------------------------------------------------
KNEE, STRENGTH = 0.30, 0.80
for y in range(h):
    for x in range(w):
        if ap[x, y] == 0:
            continue
        r, g, b = px[x, y]
        lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0
        if lum < KNEE:
            t = ((KNEE - lum) / KNEE) * STRENGTH
            px[x, y] = (round(r + (gr[0] - r) * t),
                        round(g + (gr[1] - g) * t),
                        round(b + (gr[2] - b) * t))

# ---- 4. bottom fade ------------------------------------------------------
ap = alpha.load()
start = int(h * 0.52)
for y in range(start, h):
    k = (1.0 - (y - start) / (h - start)) ** 2
    for x in range(w):
        if ap[x, y]:
            ap[x, y] = int(ap[x, y] * k)

out = im.convert("RGBA")
out.putalpha(alpha)
out.save(DST)
print(f"{DST}  ground #{GROUND}  band={BAND}px  white spill removed")
