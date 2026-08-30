"""Cut four photographed climbing holds out of their white backgrounds.

Run once, by hand, to regenerate `public/holds/*.png` from the source
photographs. Not part of `pnpm build` --- the cut-outs are committed, and the
originals live outside the repo.

The naive approach (make every near-white pixel transparent) eats the highlights
off the yellow and orange holds, which are near-white where the light hits them.
So this floods inwards from the border instead: only white *connected to the
edge* is background, and an enclosed highlight is safe however bright it is.

Anti-aliased edge pixels get partial alpha rather than a hard cut, or every hold
ships with a white fringe that is invisible on this page and obvious on a dark
wall.
"""

from collections import deque
from pathlib import Path

from PIL import Image

SOURCE = Path.home() / "Pictures" / "Screenshots"
OUT = Path(__file__).resolve().parent.parent / "public" / "holds"

# The source photographs, in the order they were taken.
HOLDS = {
    "green": "Screenshot 2026-08-30 211246.png",
    "red": "Screenshot 2026-08-30 211249.png",
    "yellow": "Screenshot 2026-08-30 211254.png",
    "orange": "Screenshot 2026-08-30 211259.png",
}

# A pixel this close to white, and reachable from the border, is background.
SOLID = 26
# Between SOLID and FEATHER it is an anti-aliased edge: keep it, fade it.
FEATHER = 90
# Longest side of the emitted PNG. The holds render at ~120px at most.
MAX_SIDE = 256


def distance_from_white(pixel):
    r, g, b = pixel[:3]
    return max(255 - r, 255 - g, 255 - b)


def cut(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    width, height = image.size
    pixels = image.load()

    # Flood inwards from every border pixel, through near-white only.
    alpha = [[255] * width for _ in range(height)]
    seen = [[False] * width for _ in range(height)]
    queue = deque()

    border = [(x, 0) for x in range(width)]
    border += [(x, height - 1) for x in range(width)]
    border += [(0, y) for y in range(height)]
    border += [(width - 1, y) for y in range(height)]

    for x, y in border:
        if not seen[y][x] and distance_from_white(pixels[x, y]) <= FEATHER:
            seen[y][x] = True
            queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        distance = distance_from_white(pixels[x, y])
        if distance <= SOLID:
            alpha[y][x] = 0
        else:
            # Anti-aliased edge: ramp alpha across the feather band so the hold
            # meets the wall on a soft edge instead of a white one.
            span = FEATHER - SOLID
            alpha[y][x] = round(255 * (distance - SOLID) / span)

        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            inside = 0 <= nx < width and 0 <= ny < height
            if not inside or seen[ny][nx]:
                continue
            # Stop at the first properly opaque pixel; do not walk into the hold.
            if distance_from_white(pixels[nx, ny]) > FEATHER:
                continue
            seen[ny][nx] = True
            queue.append((nx, ny))

    for y in range(height):
        for x in range(width):
            r, g, b, _ = pixels[x, y]
            pixels[x, y] = (r, g, b, alpha[y][x])

    cropped = image.crop(image.getbbox())
    scale = MAX_SIDE / max(cropped.size)
    if scale < 1:
        size = (round(cropped.width * scale), round(cropped.height * scale))
        cropped = cropped.resize(size, Image.LANCZOS)
    return cropped


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, filename in HOLDS.items():
        held = cut(SOURCE / filename)
        destination = OUT / f"{name}.png"
        held.save(destination, optimize=True)
        print(f"{destination.name}: {held.size[0]}x{held.size[1]}")


if __name__ == "__main__":
    main()
