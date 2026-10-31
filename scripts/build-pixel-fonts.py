"""Build pixel-exact (no anti-aliasing) web fonts from a TrueType font.

Each size is rendered with FreeType's hinted monochrome rasterizer (the same
look as Windows XP with ClearType off). The result is traced into square
pixels and saved as one WOFF2 per size. Each output font is crisp at exactly
its own px size (or whole multiples of it).

Usage:  python scripts/build-pixel-fonts.py
"""
import os
import freetype
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

FONTS_DIR = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")
SOURCES = {
    "Regular": (os.path.join(FONTS_DIR, "tahoma.ttf"), 400),
    "Bold": (os.path.join(FONTS_DIR, "tahomabd.ttf"), 700),
}
SIZES = [13, 16, 19, 24, 32]
FAMILY = "xp-tahoma"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "fonts", "xp")
UNIT = 64  # font units per pixel

RANGES = [
    (0x0020, 0x007E), (0x00A0, 0x017F), (0x2010, 0x2027),
    (0x2030, 0x203A), (0x20AC, 0x20AC), (0x2122, 0x2122),
]


def mono_rows(bitmap):
    """Yield (row, [bool per column]) for a 1-bit FreeType bitmap."""
    for y in range(bitmap.rows):
        row = bitmap.buffer[y * bitmap.pitch:(y + 1) * bitmap.pitch]
        yield y, [bool(row[x >> 3] & (0x80 >> (x & 7))) for x in range(bitmap.width)]


def build(src, weight, style, size):
    face = freetype.Face(src)
    face.set_pixel_sizes(0, size)
    src_tt = TTFont(src)
    os2, upm = src_tt["OS/2"], src_tt["head"].unitsPerEm
    ascent = round(os2.usWinAscent * size / upm)
    descent = round(os2.usWinDescent * size / upm)

    cmap, glyphs, metrics = {}, {}, {}
    order = [".notdef"]
    glyphs[".notdef"] = TTGlyphPen(None).glyph()
    metrics[".notdef"] = (round(size / 2) * UNIT, 0)

    flags = freetype.FT_LOAD_RENDER | freetype.FT_LOAD_TARGET_MONO
    for lo, hi in RANGES:
        for cp in range(lo, hi + 1):
            if not face.get_char_index(cp):
                continue
            face.load_char(chr(cp), flags)
            g = face.glyph
            bm = g.bitmap
            pen = TTGlyphPen(None)
            xmin = None
            for y, bits in mono_rows(bm):
                top = (g.bitmap_top - y) * UNIT
                x = 0
                while x < len(bits):  # merge horizontal runs into rectangles
                    if not bits[x]:
                        x += 1
                        continue
                    start = x
                    while x < len(bits) and bits[x]:
                        x += 1
                    x0 = (g.bitmap_left + start) * UNIT
                    x1 = (g.bitmap_left + x) * UNIT
                    xmin = x0 if xmin is None else min(xmin, x0)
                    pen.moveTo((x0, top - UNIT))
                    pen.lineTo((x0, top))
                    pen.lineTo((x1, top))
                    pen.lineTo((x1, top - UNIT))
                    pen.closePath()
            name = f"uni{cp:04X}"
            order.append(name)
            cmap[cp] = name
            glyphs[name] = pen.glyph()
            metrics[name] = ((g.advance.x >> 6) * UNIT, xmin or 0)

    fb = FontBuilder(size * UNIT, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=ascent * UNIT, descent=-descent * UNIT, lineGap=0)
    family = f"{FAMILY}-{size}"
    fb.setupNameTable({"familyName": family, "styleName": style})
    fb.setupOS2(
        sTypoAscender=ascent * UNIT, sTypoDescender=-descent * UNIT, sTypoLineGap=0,
        usWinAscent=ascent * UNIT, usWinDescent=descent * UNIT,
        usWeightClass=weight, fsSelection=0x20 if weight >= 700 else 0x40,
    )
    fb.font["head"].macStyle = 1 if weight >= 700 else 0
    fb.setupPost(underlinePosition=-UNIT, underlineThickness=UNIT)

    os.makedirs(OUT_DIR, exist_ok=True)
    base = os.path.join(OUT_DIR, f"{family}-{style.lower()}")
    fb.save(base + ".ttf")  # kept only for the self-check below
    fb.font.flavor = "woff2"
    fb.save(base + ".woff2")
    return base + ".ttf"


def check_crisp(ttf, size):
    """Re-render the built font WITH anti-aliasing; any gray pixel = misaligned."""
    face = freetype.Face(ttf)
    face.set_pixel_sizes(0, size)
    gray = 0
    for ch in "AaBbGgMmWwQq0123456789.,;!?@&%$()":
        face.load_char(ch, freetype.FT_LOAD_RENDER | freetype.FT_LOAD_NO_HINTING)
        gray += sum(1 for v in face.glyph.bitmap.buffer if 0 < v < 255)
    return gray


if __name__ == "__main__":
    for style, (src, weight) in SOURCES.items():
        for size in SIZES:
            ttf = build(src, weight, style, size)
            gray = check_crisp(ttf, size)
            os.remove(ttf)
            print(f"{FAMILY}-{size} {style}: {'crisp' if gray == 0 else f'{gray} gray pixels!'}")
