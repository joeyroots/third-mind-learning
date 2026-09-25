#!/usr/bin/env python3
"""One-time derivation of the three redesign photos from raw sources in
reference/joe-photos-2026-09/. Crop boxes were picked by hand (visually
verified) to exclude a third-party event banner (hero) and the most
legible third-party logos (about), and to frame a clean portrait
(founder). Re-run only if the source photos change."""
from PIL import Image

SRC = "reference/joe-photos-2026-09"
OUT = "src/assets/img"

jobs = [
    # (source file, crop box, output width, output file, quality)
    (f"{SRC}/stage-blue-light.jpg", (0, 0, 4934, 4633), 1600, f"{OUT}/joe-ruotolo-hero.jpg", 82),
    (f"{SRC}/portrait-backstage.jpg", (440, 0, 1490, 1365), 692, f"{OUT}/joe-ruotolo-founder.jpg", 85),
    (f"{SRC}/stage-videowall-1.jpg", (310, 0, 2048, 1365), 1200, f"{OUT}/joe-ruotolo-about.jpg", 82),
]

for src, box, width, out, quality in jobs:
    im = Image.open(src)
    im = im.crop(box)
    im.thumbnail((width, 999999))
    im.save(out, quality=quality, optimize=True)
    print(f"{out}: {im.size[0]}x{im.size[1]}")
