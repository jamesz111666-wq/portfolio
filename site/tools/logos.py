#!/usr/bin/env python3
"""Turn a supplied company logo into a transparent PNG for the experience page.

Run:  python3 tools/logos.py <src> <assets/logos/name.png> [tolerance] [--invert]

--invert flips the mark's colours, for a dark logo that would otherwise
disappear against the pine ground. Doing it here rather than with a CSS
filter keeps one styling rule covering every logo.

Logos arrive as flat images on a solid canvas — white, black, brand navy —
which is useless on a dark page and worse than useless under the silhouette
filter the timeline applies (a boxed logo flattens to a solid slab). This
flood-fills the canvas away from the border, so colour *inside* the mark is
kept: the white palm trees in a crest survive while the white page behind it
does not.

The mask is then feathered by a pixel so the edges do not read as jagged at
small sizes, cropped to the mark itself, and scaled to a common height so a
row of logos carries roughly equal optical weight.
"""
import sys
from collections import deque

from PIL import Image, ImageChops, ImageFilter

args = [a for a in sys.argv[1:] if a != "--invert"]
INVERT = "--invert" in sys.argv
SRC = args[0]
DST = args[1]
TOL = int(args[2]) if len(args) > 2 else 60

OUT_H = 160          # generous for retina; CSS displays these around 30px
PAD = 2


def near(a, b, tol):
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2 <= tol * tol


im = Image.open(SRC).convert("RGB")
w, h = im.size
px = im.load()

# the canvas colour, taken as the most common pixel along the border
edge = ([px[x, 0] for x in range(w)] + [px[x, h - 1] for x in range(w)]
        + [px[0, y] for y in range(h)] + [px[w - 1, y] for y in range(h)])
bg = max(set(edge), key=edge.count)

# flood fill inward from every border pixel that matches the canvas
transparent = bytearray(w * h)
q = deque()
for x in range(w):
    for y in (0, h - 1):
        if near(px[x, y], bg, TOL) and not transparent[y * w + x]:
            transparent[y * w + x] = 1
            q.append((x, y))
for y in range(h):
    for x in (0, w - 1):
        if near(px[x, y], bg, TOL) and not transparent[y * w + x]:
            transparent[y * w + x] = 1
            q.append((x, y))
while q:
    x, y = q.popleft()
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h and not transparent[ny * w + nx] \
                and near(px[nx, ny], bg, TOL):
            transparent[ny * w + nx] = 1
            q.append((nx, ny))

mask = Image.frombytes("L", (w, h), bytes(255 if not t else 0 for t in transparent))
mask = mask.filter(ImageFilter.GaussianBlur(0.6))

rgb = ImageChops.invert(im) if INVERT else im
out = rgb.convert("RGBA")
out.putalpha(mask)

box = out.getbbox()
if box:
    box = (max(0, box[0] - PAD), max(0, box[1] - PAD),
           min(w, box[2] + PAD), min(h, box[3] + PAD))
    out = out.crop(box)

scale = OUT_H / out.height
out = out.resize((max(1, round(out.width * scale)), OUT_H), Image.LANCZOS)
out.save(DST)

kept = sum(1 for t in transparent if not t) * 100 // (w * h)
print(f"{DST}  bg={bg} -> {out.width}x{out.height}, {kept}% of the source kept")
