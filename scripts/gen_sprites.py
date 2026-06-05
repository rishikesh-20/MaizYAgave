"""Generate top-down pixel-art DJ spritesheets.

Each sheet: 4 rows x 4 cols of 32x32 px frames -> 128x128 px PNG.
Rows: 0=down, 1=left, 2=right, 3=up.
Cols: 0=stand, 1=step-A, 2=stand, 3=step-B.
(Frames are usually animated as 0->1->2->3 looped.)

Run:
    cd backend && source .venv/bin/activate && python ../scripts/gen_sprites.py
Output:
    frontend/public/sprites/<name>.png
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "frontend" / "public" / "sprites"
OUT.mkdir(parents=True, exist_ok=True)

FRAME = 32
COLS = 4
ROWS = 4
SHEET_W = FRAME * COLS
SHEET_H = FRAME * ROWS

SKIN = (235, 198, 165, 255)
EYE = (16, 16, 24, 255)
PANTS = (28, 30, 46, 255)
BOOT = (12, 12, 18, 255)


def hex_to_rgba(s: str, alpha: int = 255) -> tuple[int, int, int, int]:
    s = s.lstrip("#")
    return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16), alpha)


def shade(rgba: tuple[int, int, int, int], delta: int) -> tuple[int, int, int, int]:
    r, g, b, a = rgba
    return (
        max(0, min(255, r + delta)),
        max(0, min(255, g + delta)),
        max(0, min(255, b + delta)),
        a,
    )


def draw_frame(
    img: Image.Image,
    ox: int,
    oy: int,
    direction: str,
    step: int,  # 0 stand, 1 left-fwd, 2 stand, 3 right-fwd
    body: tuple[int, int, int, int],
    accent: tuple[int, int, int, int],
) -> None:
    """Draw one 32x32 frame at (ox, oy)."""
    d = ImageDraw.Draw(img)
    body_shadow = shade(body, -40)
    accent_shadow = shade(accent, -50)

    # Shadow ellipse on the floor (always)
    d.ellipse((ox + 8, oy + 27, ox + 23, oy + 30), fill=(0, 0, 0, 90))

    # Leg poses
    left_y_offset = 0
    right_y_offset = 0
    if step == 1:
        left_y_offset = -1
        right_y_offset = 1
    elif step == 3:
        left_y_offset = 1
        right_y_offset = -1

    # Legs (8x4 each, side-by-side)
    d.rectangle(
        (ox + 12, oy + 22 + left_y_offset, ox + 14, oy + 26 + left_y_offset),
        fill=PANTS,
    )
    d.rectangle(
        (ox + 17, oy + 22 + right_y_offset, ox + 19, oy + 26 + right_y_offset),
        fill=PANTS,
    )
    # Boots
    d.rectangle(
        (ox + 12, oy + 26 + left_y_offset, ox + 14, oy + 27 + left_y_offset),
        fill=BOOT,
    )
    d.rectangle(
        (ox + 17, oy + 26 + right_y_offset, ox + 19, oy + 27 + right_y_offset),
        fill=BOOT,
    )

    # Torso (10x9)
    d.rectangle((ox + 11, oy + 13, ox + 20, oy + 22), fill=body)
    d.rectangle((ox + 11, oy + 21, ox + 20, oy + 22), fill=body_shadow)
    # Accent belt
    d.rectangle((ox + 11, oy + 20, ox + 20, oy + 20), fill=accent_shadow)

    # Arms (2x6) — slight bob with step
    arm_left_y = 14 + (1 if step == 1 else 0)
    arm_right_y = 14 + (1 if step == 3 else 0)
    d.rectangle((ox + 10, oy + arm_left_y, ox + 11, oy + arm_left_y + 6), fill=body)
    d.rectangle((ox + 20, oy + arm_right_y, ox + 21, oy + arm_right_y + 6), fill=body)

    # Head (8x8) with rounded look (skip corners)
    head_top = oy + 4
    head_left = ox + 12
    head_right = ox + 19
    head_bottom = oy + 11
    d.rectangle((head_left, head_top, head_right, head_bottom), fill=SKIN)
    # cut corners
    d.point((head_left, head_top), fill=(0, 0, 0, 0))
    d.point((head_right, head_top), fill=(0, 0, 0, 0))
    d.point((head_left, head_bottom), fill=(0, 0, 0, 0))
    d.point((head_right, head_bottom), fill=(0, 0, 0, 0))

    # Hair (accent) — direction-dependent
    if direction == "down":
        # Hair across forehead + sides
        d.rectangle((head_left, oy + 3, head_right, oy + 5), fill=accent)
        d.point((head_left, oy + 6), fill=accent)
        d.point((head_right, oy + 6), fill=accent)
        # Eyes
        d.point((ox + 14, oy + 8), fill=EYE)
        d.point((ox + 17, oy + 8), fill=EYE)
    elif direction == "up":
        # Hair = back of head, no face
        d.rectangle((head_left, oy + 3, head_right, head_bottom), fill=accent)
        # Side highlight
        d.point((head_left, oy + 6), fill=shade(accent, 30))
        d.point((head_right, oy + 6), fill=shade(accent, 30))
    elif direction == "left":
        # Profile facing left: hair on right side of head, face on left
        d.rectangle((head_left, oy + 3, head_right, oy + 5), fill=accent)
        d.rectangle((ox + 17, oy + 4, head_right, oy + 9), fill=accent)
        d.point((ox + 13, oy + 8), fill=EYE)
    elif direction == "right":
        d.rectangle((head_left, oy + 3, head_right, oy + 5), fill=accent)
        d.rectangle((head_left, oy + 4, ox + 14, oy + 9), fill=accent)
        d.point((ox + 18, oy + 8), fill=EYE)


def make_sheet(body_hex: str, accent_hex: str, out_path: Path) -> None:
    img = Image.new("RGBA", (SHEET_W, SHEET_H), (0, 0, 0, 0))
    body = hex_to_rgba(body_hex)
    accent = hex_to_rgba(accent_hex)
    directions = ["down", "left", "right", "up"]
    for row, direction in enumerate(directions):
        for col in range(COLS):
            ox = col * FRAME
            oy = row * FRAME
            draw_frame(img, ox, oy, direction, col, body, accent)
    img.save(out_path)
    print(f"wrote {out_path.relative_to(ROOT)}")


def make_crowd_sheet(out_path: Path) -> None:
    """Generic dancer sprite: 2 frames (bob low / bob high)."""
    sheet = Image.new("RGBA", (FRAME * 2, FRAME), (0, 0, 0, 0))
    for i, dy in enumerate((0, -1)):
        img = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        d.ellipse((9, 27, 22, 30), fill=(0, 0, 0, 80))
        # body
        body = (110, 118, 150, 255)
        d.rectangle((12, 14 + dy, 19, 22 + dy), fill=body)
        # head
        d.rectangle((12, 6 + dy, 19, 11 + dy), fill=SKIN)
        d.rectangle((12, 5 + dy, 19, 7 + dy), fill=(40, 40, 60, 255))
        # arms up (dancing)
        d.rectangle((10, 12 + dy - i, 11, 16 + dy - i), fill=body)
        d.rectangle((20, 12 + dy - i, 21, 16 + dy - i), fill=body)
        sheet.paste(img, (i * FRAME, 0))
    sheet.save(out_path)
    print(f"wrote {out_path.relative_to(ROOT)}")


PERSONAS = [
    ("nova", "#ff4fa3", "#5af7ff"),
    ("lumen", "#9ec5ff", "#e8f1ff"),
    ("pulse", "#ffa64d", "#ffd27a"),
    ("volt", "#3a3a3a", "#ff2e3a"),
    ("zephyr", "#7CFF6B", "#b6ffae"),
]


def main() -> None:
    for slug, body, accent in PERSONAS:
        make_sheet(body, accent, OUT / f"{slug}.png")
    make_crowd_sheet(OUT / "crowd.png")


if __name__ == "__main__":
    main()
