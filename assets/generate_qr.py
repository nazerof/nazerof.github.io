"""Generate a branded, easy-to-scan QR for Nazer's add-me page.

Outputs:
  qr-add-me.png        — square QR with brand colors, rounded modules
  qr-add-me-card.png   — printable card (QR + name + tagline + scan-me)
"""
from pathlib import Path
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers.pil import RoundedModuleDrawer
from qrcode.image.styles.colormasks import SolidFillColorMask
from PIL import Image, ImageDraw, ImageFont

URL = "https://nazerof.github.io/pages/add-me.html"
OUT_DIR = Path(__file__).parent
PHOTO = OUT_DIR.parent / "Nazer_Hadifeh_pic1.jpg"

# Brand colors (match add-me hero gradient roughly)
FG = (38, 39, 79)        # deep indigo
BG = (255, 255, 255)

# --- 1. Plain styled QR (high error-correction so logo overlay is safe) ---
qr = qrcode.QRCode(
    version=None,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=14,
    border=2,
)
qr.add_data(URL)
qr.make(fit=True)

img = qr.make_image(
    image_factory=StyledPilImage,
    module_drawer=RoundedModuleDrawer(radius_ratio=1.0),
    color_mask=SolidFillColorMask(back_color=BG, front_color=FG),
).convert("RGB")

# Embed a small circular profile photo at the center
if PHOTO.exists():
    qr_w, qr_h = img.size
    logo_size = qr_w // 5
    logo = Image.open(PHOTO).convert("RGBA")
    # crop square then resize
    s = min(logo.size)
    left = (logo.width - s) // 2
    top = 0  # bias to top so face stays in frame
    logo = logo.crop((left, top, left + s, top + s)).resize((logo_size, logo_size), Image.LANCZOS)
    # circular mask
    mask = Image.new("L", (logo_size, logo_size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, logo_size, logo_size), fill=255)
    # white halo behind logo
    halo_pad = 14
    halo_size = logo_size + halo_pad * 2
    halo = Image.new("RGBA", (halo_size, halo_size), (0, 0, 0, 0))
    ImageDraw.Draw(halo).ellipse((0, 0, halo_size, halo_size), fill=(255, 255, 255, 255))
    pos_halo = ((qr_w - halo_size) // 2, (qr_h - halo_size) // 2)
    img.paste(halo, pos_halo, halo)
    pos_logo = ((qr_w - logo_size) // 2, (qr_h - logo_size) // 2)
    img.paste(logo, pos_logo, mask)

img.save(OUT_DIR / "qr-add-me.png")
print(f"Saved qr-add-me.png  ({img.size[0]}x{img.size[1]})")

# --- 2. Print-ready card (A4-friendly tile, ~1200x1500 px @ ~150dpi) ---
CARD_W, CARD_H = 1200, 1500
card = Image.new("RGB", (CARD_W, CARD_H), (255, 255, 255))
draw = ImageDraw.Draw(card)

# Brand gradient header band
band_h = 220
for y in range(band_h):
    t = y / band_h
    r = int(102 + (118 - 102) * t)
    g = int(126 + (75 - 126) * t)
    b = int(234 + (162 - 234) * t)
    draw.line([(0, y), (CARD_W, y)], fill=(r, g, b))

# Try to load a nice font, fallback to default
def load_font(size, bold=False):
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for p in candidates:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

f_name = load_font(72, bold=True)
f_role = load_font(34)
f_scan = load_font(48, bold=True)
f_url = load_font(26)
f_small = load_font(22)

# Header text (white on gradient)
draw.text((CARD_W // 2, 70), "Nazer Hdaifeh", font=f_name, fill=(255, 255, 255), anchor="mm")
draw.text((CARD_W // 2, 140), "Founder & CEO, PerSpark", font=f_role, fill=(255, 255, 255), anchor="mm")
draw.text((CARD_W // 2, 185), "AI & Data Science Consultant   ·   Aarhus", font=f_small, fill=(230, 230, 245), anchor="mm")

# QR placement (resize for clarity)
qr_target = 760
qr_print = img.resize((qr_target, qr_target), Image.LANCZOS)
qr_x = (CARD_W - qr_target) // 2
qr_y = band_h + 80
card.paste(qr_print, (qr_x, qr_y))

# "Scan to connect" callout
draw.text((CARD_W // 2, qr_y + qr_target + 70), "Scan to connect", font=f_scan, fill=(38, 39, 79), anchor="mm")
draw.text((CARD_W // 2, qr_y + qr_target + 130),
          "Save my contact · Download CV · LinkedIn",
          font=f_url, fill=(110, 116, 134), anchor="mm")
draw.text((CARD_W // 2, qr_y + qr_target + 175),
          "nazerof.github.io",
          font=f_small, fill=(160, 165, 180), anchor="mm")

# Footer accent line
draw.rectangle([(80, CARD_H - 40), (CARD_W - 80, CARD_H - 36)], fill=(102, 126, 234))

card.save(OUT_DIR / "qr-add-me-card.png", dpi=(300, 300))
print(f"Saved qr-add-me-card.png  ({CARD_W}x{CARD_H})")
print(f"URL encoded: {URL}")
