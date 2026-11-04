#!/usr/bin/env python3
"""Génère le logo source TOUVOIR utilisé par @capacitor/assets."""

from math import pi, sin
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "resources" / "logo.png"
SIZE = 1024
SCALE = 4
W = SIZE * SCALE


def lerp(a: int, b: int, t: float) -> int:
    return round(a + (b - a) * t)


def vertical_gradient(size: int, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    image = Image.new("RGB", (1, size))
    for y in range(size):
        t = y / max(1, size - 1)
        image.putpixel((0, y), tuple(lerp(top[i], bottom[i], t) for i in range(3)))
    return image.resize((size, size)).convert("RGBA")


def shield_points(scale: float = 1.0, cx: float = 0.5, cy: float = 0.5) -> list[tuple[float, float]]:
    base = [
        (0.50, 0.055),
        (0.81, 0.155),
        (0.79, 0.50),
        (0.72, 0.72),
        (0.50, 0.95),
        (0.28, 0.72),
        (0.21, 0.50),
        (0.19, 0.155),
    ]
    return [
        ((cx + (x - 0.5) * scale) * W, (cy + (y - 0.5) * scale) * W)
        for x, y in base
    ]


canvas = Image.new("RGBA", (W, W), (0, 0, 0, 0))

# Bouclier avec dégradé bleu TOUVOIR.
mask = Image.new("L", (W, W), 0)
mask_draw = ImageDraw.Draw(mask)
mask_draw.polygon(shield_points(0.92), fill=255)
gradient = vertical_gradient(W, (26, 111, 219), (9, 45, 110))
canvas.paste(gradient, (0, 0), mask)

draw = ImageDraw.Draw(canvas)
# Liseré clair intérieur.
draw.line(shield_points(0.82) + [shield_points(0.82)[0]], fill=(132, 211, 255, 230), width=10 * SCALE, joint="curve")

# Œil : deux courbes symétriques remplies en blanc.
cx, cy = 0.5 * W, 0.48 * W
eye_half_width = 0.255 * W
eye_half_height = 0.135 * W
upper: list[tuple[float, float]] = []
lower: list[tuple[float, float]] = []
for i in range(121):
    t = i / 120
    x = cx - eye_half_width + 2 * eye_half_width * t
    curve = sin(pi * t) ** 0.72
    upper.append((x, cy - eye_half_height * curve))
    lower.append((x, cy + eye_half_height * curve))
draw.polygon(upper + list(reversed(lower)), fill=(255, 255, 255, 255))

# Iris/pupille façon objectif de caméra.
iris_r = 0.104 * W
pupil_r = 0.052 * W
draw.ellipse((cx - iris_r, cy - iris_r, cx + iris_r, cy + iris_r), fill=(0, 184, 240, 255))
draw.ellipse((cx - pupil_r, cy - pupil_r, cx + pupil_r, cy + pupil_r), fill=(5, 35, 82, 255))
hl_r = 0.018 * W
hl_x, hl_y = cx - 0.035 * W, cy - 0.038 * W
draw.ellipse((hl_x - hl_r, hl_y - hl_r, hl_x + hl_r, hl_y + hl_r), fill=(255, 255, 255, 255))

# Petit point d'enregistrement, discret et lisible en petite taille.
rec_x, rec_y, rec_r = 0.665 * W, 0.315 * W, 0.020 * W
draw.ellipse((rec_x - rec_r, rec_y - rec_r, rec_x + rec_r, rec_y + rec_r), fill=(255, 92, 92, 255))

OUT.parent.mkdir(parents=True, exist_ok=True)
canvas.resize((SIZE, SIZE), Image.Resampling.LANCZOS).save(OUT, optimize=True)
print(f"Logo généré : {OUT}")
