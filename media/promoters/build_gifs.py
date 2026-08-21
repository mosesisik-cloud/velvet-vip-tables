"""Build looping VELVET promoter GIFs from still backgrounds + exact names."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent
SESSION = Path(r"C:\Users\moses.isik\.grok\sessions\C%3A%5CUsers%5Cmoses.isik%5CDesktop\01a02176-9bed-7af3-b7d0-0ecee9ff8d9d\images")

SIZE = 280
FRAMES = 10
GOLD = (232, 196, 122, 255)
GOLD_DIM = (212, 175, 95, 220)
WHITE = (248, 244, 236, 255)
FONT_NAME = ImageFont.truetype(r"C:\Windows\Fonts\georgiab.ttf", 28)
FONT_SMALL = ImageFont.truetype(r"C:\Windows\Fonts\georgia.ttf", 13)
FONT_TINY = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 11)

CARDS = [
    ("jb", SESSION / "1.jpg", "JB", "Bagatelle · Baoli", "världen"),
    ("thomas", SESSION / "4.jpg", "THOMAS", "Dubai", ""),
    ("vincenzo", SESSION / "2.jpg", "VINCENZO", "Europa", ""),
    ("strebel", SESSION / "3.jpg", "FREDRIK STREBEL", "Sverige", ""),
]


def cover(im, size):
    im = im.convert("RGB")
    w, h = im.size
    scale = max(size / w, size / h)
    nw, nh = int(w * scale) + 2, int(h * scale) + 2
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - size) // 2
    top = (nh - size) // 2
    return im.crop((left, top, left + size, top + size))


def plate(bg, line1, line2, line3, zoom=1.0):
    extra = int(SIZE * (zoom - 1) * 0.5)
    big = SIZE + extra * 2
    base = cover(bg, big)
    # slight crop for ken burns
    ox = extra
    oy = int(extra * 0.35)
    frame = base.crop((ox, oy, ox + SIZE, oy + SIZE))
    overlay = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.rectangle((0, int(SIZE * 0.52), SIZE, SIZE), fill=(10, 8, 6, 168))
    d.rounded_rectangle((10, 10, SIZE - 11, SIZE - 11), radius=20, outline=GOLD_DIM, width=2)
    y = int(SIZE * 0.60)
    def center(text, font, y, fill):
        bbox = d.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        d.text(((SIZE - tw) / 2, y), text, font=font, fill=fill)
        return bbox[3] - bbox[1]
    h1 = center(line1, FONT_NAME, y, GOLD)
    y2 = y + h1 + 6
    if line2:
        h2 = center(line2, FONT_SMALL, y2, WHITE)
        y2 += h2 + 4
    if line3:
        center(line3, FONT_TINY, y2, GOLD_DIM)
    brand = ImageDraw.Draw(overlay)
    bb = overlay
    # VELVET mark
    tiny = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 11)
    brand.text((22, 22), "VELVET.", font=tiny, fill=GOLD)
    out = Image.alpha_composite(frame.convert("RGBA"), overlay)
    return out.convert("P", palette=Image.Palette.ADAPTIVE, colors=96)


def gif(name, src, line1, line2, line3):
    bg = Image.open(src)
    frames = []
    for i in range(FRAMES):
        t = i / (FRAMES - 1)
        zoom = 1.0 + 0.07 * t
        frames.append(plate(bg, line1, line2, line3, zoom))
    dest = ROOT / f"{name}.gif"
    frames[0].save(
        dest,
        save_all=True,
        append_images=frames[1:],
        duration=110,
        loop=0,
        optimize=True,
        disposal=2,
    )
    still = cover(bg, SIZE)
    still.save(ROOT / f"{name}.jpg", quality=88)
    print(dest.name, dest.stat().st_size)


def team():
    paths = [ROOT / f"{n}.jpg" for n, *_ in CARDS]
    cell = 160
    canvas = Image.new("RGB", (cell * 2, cell * 2), (12, 10, 8))
    for i, p in enumerate(paths):
        im = cover(Image.open(p), cell)
        x, y = (i % 2) * cell, (i // 2) * cell
        canvas.paste(im, (x, y))
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.rectangle((0, 0, canvas.size[0], 36), fill=(10, 8, 6, 180))
    font = ImageFont.truetype(r"C:\Windows\Fonts\georgiab.ttf", 18)
    d.text((12, 8), "VELVET  ·  promoters", font=font, fill=GOLD)
    labels = ["JB", "THOMAS", "VINCENZO", "STREBEL"]
    small = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 13)
    for i, lab in enumerate(labels):
        x, y = (i % 2) * cell, (i // 2) * cell
        d.rectangle((x, y + cell - 28, x + cell, y + cell), fill=(10, 8, 6, 170))
        d.text((x + 10, y + cell - 22), lab, font=small, fill=GOLD)
    still = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")
    frames = []
    for i in range(8):
        t = i / 7
        z = 1.0 + 0.04 * t
        big = int(still.size[0] * z)
        scaled = still.resize((big, big), Image.Resampling.LANCZOS)
        left = (big - still.size[0]) // 2
        crop = scaled.crop((left, left, left + still.size[0], left + still.size[1]))
        frames.append(crop.convert("P", palette=Image.Palette.ADAPTIVE, colors=64))
    dest = ROOT / "velvet-promoters.gif"
    frames[0].save(dest, save_all=True, append_images=frames[1:], duration=120, loop=0, optimize=True)
    still.save(ROOT / "velvet-promoters.jpg", quality=88)
    print(dest.name, dest.stat().st_size)


if __name__ == "__main__":
    for row in CARDS:
        if not row[1].exists():
            raise SystemExit("missing " + str(row[1]))
        gif(*row)
    team()
