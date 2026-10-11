import base64
import hashlib
import io
import json
import os
import re
import shutil
import tempfile
import uuid
import zipfile
import datetime as dt
import ipaddress
import secrets
import socket
import sqlite3
import hmac
from urllib.parse import urlparse
from flask import Flask, after_this_request, jsonify, make_response, redirect, render_template, request, send_file, url_for
from flask_cors import CORS
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import qrcode
from PIL import Image, ImageFilter, ImageOps, ImageEnhance
import requests
import yt_dlp
import concurrent.futures
from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from docx import Document
import fitz
import pytesseract


app = Flask(__name__)
app.instance_path = os.environ.get("INSTANCE_PATH", app.instance_path)
CORS(app)
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Maximum upload size: 20 MB
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024


@app.after_request
def add_tool_feedback_assets(response):
    if response.mimetype != "text/html" or response.status_code >= 400 or response.is_streamed:
        return response

    page = response.get_data(as_text=True)
    if "</head>" not in page or "</body>" not in page:
        return response

    if not re.search(r"<meta\s+name=['\"]viewport['\"]", page, re.IGNORECASE):
        page = page.rsplit("</head>", 1)[0] + '<meta name="viewport" content="width=device-width, initial-scale=1.0"></head>' + page.rsplit("</head>", 1)[1]

    theme_bootstrap = '<script>try{document.documentElement.dataset.theme=location.pathname==="/"||localStorage.getItem("thakronix-theme:v7")==="dark"?"dark":"light"}catch(e){document.documentElement.dataset.theme=location.pathname==="/"?"dark":"light"}</script>'
    stylesheets = (
        '<link rel="stylesheet" href="/static/css/tool_feedback.css?v=6">'
        '<link rel="stylesheet" href="/static/css/theme_system.css?v=4">'
        '<link rel="stylesheet" href="/static/css/tool_app_shell.css?v=2">'
        '<link rel="stylesheet" href="/static/css/next_action.css?v=1">'
        '<link rel="stylesheet" href="/static/css/site_responsive.css?v=1">'
    )
    scripts = (
        '<script defer src="/static/js/tool_feedback.js?v=7"></script>'
        '<script defer src="/static/js/theme_system.js?v=6"></script>'
        '<script defer src="/static/js/tool_app_shell.js?v=7"></script>'
        '<script defer src="/static/js/next_action.js?v=7"></script>'
    )
    page = page.rsplit("</head>", 1)[0] + f"{theme_bootstrap}{stylesheets}</head>" + page.rsplit("</head>", 1)[1]
    page = page.rsplit("</body>", 1)[0] + f"{scripts}</body>" + page.rsplit("</body>", 1)[1]
    response.set_data(page)
    return response

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "bmp", "gif"}

SECURE_SHARES = {}

EMERGENCY_QR_FIELDS = {
    "name": ("Name", "Profile"),
    "father_contact": ("Father", "Emergency contacts"),
    "mother_contact": ("Mother", "Emergency contacts"),
    "blood_group": ("Blood group", "Important information"),
    "allergies": ("Allergies", "Important information"),
    "medical_info": ("Medical information", "Important information"),
    "emergency_notes": ("Emergency notes", "Important information"),
    "doctor": ("Doctor / clinic", "Emergency contacts"),
    "insurance": ("Insurance", "Insurance & documents"),
    "insurance_available": ("Insurance available", "Insurance & documents"),
    "vehicle": ("Vehicle details", "Insurance & documents"),
    "id_document": ("ID document", "Important documents"),
    "insurance_document": ("Insurance document", "Important documents"),
    "vehicle_document": ("Vehicle document", "Important documents"),
    "instructions": ("Emergency instructions", "Important information"),
}


def _emergency_qr_db():
    os.makedirs(app.instance_path, exist_ok=True)
    connection = sqlite3.connect(os.path.join(app.instance_path, "emergency_qr.sqlite3"))
    connection.execute("""CREATE TABLE IF NOT EXISTS emergency_qr_shares (
        token TEXT PRIMARY KEY,
        nonce BLOB NOT NULL,
        ciphertext BLOB NOT NULL,
        expires_at TEXT NOT NULL,
        revoke_hash TEXT NOT NULL,
        revoked INTEGER NOT NULL DEFAULT 0
    )""")
    connection.commit()
    return connection


def _emergency_qr_key():
    configured_key = os.environ.get("EMERGENCY_QR_KEY")
    if configured_key:
        try:
            key = base64.urlsafe_b64decode(configured_key + "=" * (-len(configured_key) % 4))
        except (ValueError, base64.binascii.Error) as exc:
            raise RuntimeError("EMERGENCY_QR_KEY must be URL-safe base64 for 32 random bytes.") from exc
        if len(key) != 32:
            raise RuntimeError("EMERGENCY_QR_KEY must decode to exactly 32 bytes.")
        return key

    os.makedirs(app.instance_path, exist_ok=True)
    key_path = os.path.join(app.instance_path, "emergency_qr.key")
    try:
        with open(key_path, "xb") as key_file:
            key_file.write(secrets.token_bytes(32))
    except FileExistsError:
        pass
    try:
        os.chmod(key_path, 0o600)
    except OSError:
        pass
    with open(key_path, "rb") as key_file:
        key = key_file.read()
    if len(key) != 32:
        raise RuntimeError("Emergency QR encryption key is invalid; set EMERGENCY_QR_KEY or restore the key file.")
    return key


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


def parse_number(value, name, minimum=None, maximum=None, integer=False):
    """Parse a bounded form value and raise a user-facing validation error."""
    try:
        parsed = int(value) if integer else float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{name} must be a valid number.")

    if minimum is not None and parsed < minimum:
        raise ValueError(f"{name} must be at least {minimum}.")
    if maximum is not None and parsed > maximum:
        raise ValueError(f"{name} must be at most {maximum}.")
    return parsed


def parse_target_size(value):
    """Convert an optional human-readable target size into bytes."""
    if not value or not value.strip():
        return None
    match = re.fullmatch(r"\s*(\d+(?:\.\d+)?)\s*(KB|MB|B)?\s*", value, re.IGNORECASE)
    if not match:
        raise ValueError("Target size must look like 500 KB or 1.2 MB.")
    amount = float(match.group(1))
    unit = (match.group(2) or "B").upper()
    target = int(amount * {"B": 1, "KB": 1024, "MB": 1024 * 1024}[unit])
    if target <= 0:
        raise ValueError("Target size must be greater than zero.")
    return target


def image_to_base64(image, image_format="PNG"):
    """Return a data URL string for a PIL image."""
    buffer = io.BytesIO()
    image.save(buffer, format=image_format.upper())
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/{image_format.lower()};base64,{encoded}"


def base64_to_image(data_uri):
    """Convert a base64 data URL or raw base64 string into a PIL image."""
    if not data_uri:
        raise ValueError("Base64 value is empty.")

    value = data_uri.strip()
    if "," in value:
        value = value.split(",", 1)[1]

    if not value:
        raise ValueError("Base64 content is missing.")

    binary = base64.b64decode(value)
    image = Image.open(io.BytesIO(binary))

    if image.mode == "RGBA":
        alpha = image.getchannel("A")
        if alpha.getextrema() == (255, 255):
            return image.convert("RGB")
        return image

    if image.mode not in ("RGB", "L"):
        return image.convert("RGBA")

    return image


def remove_background(image, color_threshold=245):
    """Remove near-white backgrounds by making them transparent."""
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if r >= color_threshold and g >= color_threshold and b >= color_threshold:
                pixels[x, y] = (255, 255, 255, 0)
            elif abs(r - g) <= 15 and abs(r - b) <= 15 and r >= color_threshold:
                pixels[x, y] = (255, 255, 255, 0)

    return rgba


# ==========================================
# PDF DOCUMENT HELPERS
# ==========================================

def merge_pdf_bytes(pdf_bytes_list):
    """Merge multiple PDF byte payloads into one PDF file."""
    if not pdf_bytes_list:
        raise ValueError("At least one PDF file is required.")

    writer = PdfWriter()
    for pdf_bytes in pdf_bytes_list:
        if not pdf_bytes:
            continue
        reader = PdfReader(io.BytesIO(pdf_bytes))
        for page in reader.pages:
            writer.add_page(page)

    output = io.BytesIO()
    writer.write(output)
    output.seek(0)
    return output.getvalue()


def split_pdf_pages(pdf_bytes, start_page=1, end_page=None):
    """Return a PDF containing selected pages from 1-based page ranges."""
    if not pdf_bytes:
        raise ValueError("PDF input is empty.")

    reader = PdfReader(io.BytesIO(pdf_bytes))
    total_pages = len(reader.pages)
    if total_pages == 0:
        raise ValueError("PDF contains no pages.")

    start = max(1, int(start_page))
    end = min(total_pages, int(end_page or total_pages))
    if start > end:
        raise ValueError("Start page must be before end page.")

    writer = PdfWriter()
    for idx in range(start - 1, end):
        writer.add_page(reader.pages[idx])

    output = io.BytesIO()
    writer.write(output)
    output.seek(0)
    return output.getvalue()


def pdf_to_jpg_bytes(pdf_bytes, page_index=0):
    """Render the selected PDF page into a JPEG byte stream."""
    if not pdf_bytes:
        raise ValueError("PDF input is empty.")

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    if doc.page_count == 0:
        raise ValueError("PDF contains no pages.")

    page_number = max(0, min(page_index, doc.page_count - 1))
    page = doc.load_page(page_number)
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))

    image = Image.open(io.BytesIO(pix.tobytes("png")))
    image = image.convert("RGB")

    output = io.BytesIO()
    image.save(output, format="JPEG", quality=92)
    output.seek(0)
    return output.getvalue()


def jpg_to_pdf_bytes(image_bytes):
    """Create a single-page PDF from one image."""
    if not image_bytes:
        raise ValueError("Image input is empty.")

    image = Image.open(io.BytesIO(image_bytes))
    rgb = image.convert("RGB")

    width, height = rgb.size
    pdf_buffer = io.BytesIO()
    pdf = canvas.Canvas(pdf_buffer, pagesize=(width, height))
    pdf.drawInlineImage(rgb, 0, 0, width=width, height=height)
    pdf.save()
    pdf_buffer.seek(0)
    return pdf_buffer.getvalue()


def pdf_to_word_bytes(pdf_bytes):
    """Extract text from a PDF and save it as a .docx file."""
    if not pdf_bytes:
        raise ValueError("PDF input is empty.")

    document = Document()
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    for page_num in range(doc.page_count):
        text = doc.load_page(page_num).get_text("text")
        if text.strip():
            document.add_paragraph(text)

    output = io.BytesIO()
    document.save(output)
    output.seek(0)
    return output.getvalue()


def word_to_pdf_bytes(docx_bytes):
    """Convert a .docx document to a PDF using the document text."""
    if not docx_bytes:
        raise ValueError("Word file input is empty.")

    text_document = Document(io.BytesIO(docx_bytes))
    paragraphs = [p.text for p in text_document.paragraphs if p.text.strip()]
    content = "\n".join(paragraphs) or "Converted Word document"

    output = io.BytesIO()
    pdf = canvas.Canvas(output, pagesize=letter)
    pdf.setTitle("Converted Document")
    pdf.setFont("Helvetica", 11)
    y = 760
    for line in content.splitlines():
        if y <= 40:
            pdf.showPage()
            y = 760
        pdf.drawString(60, y, line[:110])
        y -= 18
    pdf.save()
    output.seek(0)
    return output.getvalue()


def compress_pdf_bytes(pdf_bytes, quality=0.7):
    """Compress a PDF by re-rendering pages at a lower quality."""
    if not pdf_bytes:
        raise ValueError("PDF input is empty.")

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    output = io.BytesIO()
    new_pdf = canvas.Canvas(output, pagesize=letter)
    scale = max(0.4, min(1.0, float(quality)))

    for page_number in range(doc.page_count):
        page = doc.load_page(page_number)
        pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale))
        image = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
        pdf_page = new_pdf._pagesize
        new_pdf.setPageSize((pdf_page[0], pdf_page[1]))
        new_pdf.drawInlineImage(image, 0, 0, width=pdf_page[0], height=pdf_page[1])
        new_pdf.showPage()

    new_pdf.save()
    output.seek(0)
    return output.getvalue()


def rotate_pdf_pages(pdf_bytes, angle=90):
    """Rotate all pages in a PDF by the specified angle."""
    if not pdf_bytes:
        raise ValueError("PDF input is empty.")

    reader = PdfReader(io.BytesIO(pdf_bytes))
    writer = PdfWriter()
    for page in reader.pages:
        page.rotate(angle)
        writer.add_page(page)

    output = io.BytesIO()
    writer.write(output)
    output.seek(0)
    return output.getvalue()


def unlock_pdf_bytes(pdf_bytes, password=""):
    """Remove PDF encryption when the password is provided."""
    if not pdf_bytes:
        raise ValueError("PDF input is empty.")

    reader = PdfReader(io.BytesIO(pdf_bytes))
    if reader.is_encrypted:
        if not password:
            raise ValueError("Password required to unlock PDF.")
        if not reader.decrypt(password):
            raise ValueError("Incorrect password for PDF.")

    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)

    output = io.BytesIO()
    writer.write(output)
    output.seek(0)
    return output.getvalue()


def pdf_to_text(pdf_bytes):
    """Extract text from a PDF file."""
    if not pdf_bytes:
        raise ValueError("PDF input is empty.")

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    for page_number in range(doc.page_count):
        text = doc.load_page(page_number).get_text("text")
        pages.append(text.strip())
    return "\n\n".join(p for p in pages if p)


def image_to_text(image_bytes):
    """OCR an image into text using Tesseract if available."""
    if not image_bytes:
        raise ValueError("Image input is empty.")

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    try:
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as exc:
        raise RuntimeError(f"OCR failed: {exc}") from exc


# ==========================================
# YOUTUBE VIDEO ID EXTRACTOR
# ==========================================

def extract_video_id(url):
    if not url:
        return None

    patterns = [
        r'(?:v=|\/vi\/|v\/|vi\/|e\/|embed\/|shorts\/|user\/[^\/]+\/u\/[0-9]+\/)([a-zA-Z0-9_-]{11})',
        r'(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([a-zA-Z0-9_-]{11})'
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    return None


# ==========================================
# FORMAT DURATION
# ==========================================

def format_duration(seconds):
    if not seconds:
        return "N/A"

    try:
        seconds = int(seconds)
        mins, secs = divmod(seconds, 60)
        hrs, mins = divmod(mins, 60)

        if hrs > 0:
            return f"{hrs:02d}:{mins:02d}:{secs:02d}"

        return f"{mins:02d}:{secs:02d}"

    except Exception:
        return "N/A"


# ==========================================
# EXTRACT HASHTAGS
# ==========================================

def extract_all_hashtags(info, description):
    """Extract hashtags from tags & description without duplicates"""

    tags_set = set()

    tags = info.get("tags") or []

    for t in tags:
        clean_tag = f"#{re.sub(r'[^a-zA-Z0-9_]', '', t)}"

        if len(clean_tag) > 1:
            tags_set.add(clean_tag)

    if description:
        desc_tags = re.findall(r'#[\w\d_]+', description)

        for dt in desc_tags:
            tags_set.add(dt)

    return list(tags_set) if tags_set else [
        "#youtube",
        "#trending",
        "#viral"
    ]


# ==========================================
# FAST YOUTUBE FETCH
# ==========================================

def fetch_youtube_metadata(url):
    """
    Fast and timeout-safe YouTube metadata fetch.

    yt-dlp is executed in a separate thread so that
    a slow YouTube response does not keep the Flask
    request stuck forever.
    """

    def worker():
        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,

            # IMPORTANT:
            # Prevent long/hanging requests
            "socket_timeout": 3,
            "timeout": 3,

            # Do not keep retrying again and again
            "retries": 0,
            "fragment_retries": 0,

            # Avoid unnecessary playlist processing
            "noplaylist": True,

            # Prevent downloads
            "cachedir": False,

            # User agent
            "http_headers": {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 "
                    "(KHTML, like Gecko) "
                    "Chrome/121.0.0.0 Safari/537.36"
                )
            },

            # Faster YouTube clients
            "extractor_args": {
                "youtube": {
                    "player_client": ["android", "web"]
                }
            }
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return ydl.extract_info(url, download=False)

        except Exception as e:
            print("Fast yt-dlp Error:", e)
            return None

    try:
        # Maximum total wait time = 4 seconds
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:

            future = executor.submit(worker)

            try:
                return future.result(timeout=4)

            except concurrent.futures.TimeoutError:
                print("yt-dlp timed out. Using fast fallback.")
                return None

    except Exception as e:
        print("Metadata Fetch Error:", e)
        return None


# ==========================================
# FAST OEMBED FALLBACK
# ==========================================

def fetch_oembed_metadata(video_id):
    """
    Fast YouTube oEmbed fallback.
    Does not use yt-dlp.
    """

    title = f"YouTube Video ({video_id})"
    channel = "YouTube Channel"
    thumbnail = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"

    try:
        headers = {
            "User-Agent": "Mozilla/5.0"
        }

        oembed_url = (
            "https://www.youtube.com/oembed"
            f"?url=https://www.youtube.com/watch?v={video_id}"
            "&format=json"
        )

        response = requests.get(
            oembed_url,
            headers=headers,
            timeout=3
        )

        if response.status_code == 200:
            data = response.json()

            title = data.get("title") or title
            channel = data.get("author_name") or channel
            thumbnail = data.get("thumbnail_url") or thumbnail

    except Exception as e:
        print("oEmbed Error:", e)

    return {
        "title": title,
        "channel": channel,
        "thumbnail": thumbnail
    }


# ============================
# MAIN NAVIGATION ROUTES
# ============================

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/developer")
def developer_profile():
    return render_template("developer.html")


@app.route("/developer/projects/thakronix")
def thakronix_case_study():
    return render_template("developer_case_study.html")


@app.route("/api/developer-contact", methods=["POST"])
def submit_developer_contact():
    data = request.get_json(silent=True) or {}
    if str(data.get("website", "")).strip():
        return jsonify({"ok": True}), 201

    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip()
    message = str(data.get("message", "")).strip()
    if not name or len(name) > 80:
        return jsonify({"ok": False, "error": "Enter a name under 80 characters."}), 400
    if len(email) > 254 or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return jsonify({"ok": False, "error": "Enter a valid email address."}), 400
    if not message or len(message) > 1600:
        return jsonify({"ok": False, "error": "Write a message under 1,600 characters."}), 400

    record = {
        "name": name,
        "email": email,
        "message": message,
        "receivedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
    }
    try:
        os.makedirs(app.instance_path, exist_ok=True)
        with open(os.path.join(app.instance_path, "developer_messages.jsonl"), "a", encoding="utf-8") as message_file:
            message_file.write(json.dumps(record, ensure_ascii=False) + "\n")
    except OSError:
        app.logger.exception("Unable to save developer contact message")
        return jsonify({"ok": False, "error": "Message could not be saved right now."}), 500
    return jsonify({"ok": True}), 201


@app.route("/api/tool-requests", methods=["POST"])
def submit_tool_request():
    data = request.get_json(silent=True) or {}
    description = str(data.get("request", "")).strip()
    reply_email = str(data.get("replyEmail", "")).strip()

    if not description:
        return jsonify({"error": "Please describe the tool you need."}), 400
    if len(description) > 1200:
        return jsonify({"error": "Please keep your request under 1,200 characters."}), 400
    if len(reply_email) > 254 or (reply_email and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", reply_email)):
        return jsonify({"error": "Please enter a valid reply email address."}), 400

    record = {
        "request": description,
        "replyEmail": reply_email,
        "submittedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
    }
    try:
        os.makedirs(app.instance_path, exist_ok=True)
        with open(os.path.join(app.instance_path, "tool_requests.jsonl"), "a", encoding="utf-8") as requests_file:
            requests_file.write(json.dumps(record, ensure_ascii=False) + "\n")
    except OSError:
        app.logger.exception("Unable to save tool request")
        return jsonify({"error": "We couldn't save your request right now. Please try again."}), 500

    return jsonify({"ok": True}), 201


@app.route("/tools")
def tools():
    return render_template("tools.html")


@app.route("/fun-games")
def fun_games():
    return redirect(url_for("entertainment_hub"))


@app.route("/calculators")
def calculators():
    return render_template("calculators/index.html")


@app.route("/ai-tools")
def ai_tools():
    return render_template("ai_tools.html")


@app.route("/security-tools")
def security_tools():
    return render_template("security/index.html")


@app.route("/utility-studio")
def utility_studio():
    return render_template("utility_studio.html")


@app.route("/documents")
def documents():
    return render_template("documents.html")


@app.route("/entertainment")
def entertainment_hub():
    return render_template("entertainment.html")


@app.route("/finance")
def finance_hub():
    return render_template("finance.html")


@app.route("/home-travel-tools")
@app.route("/home-tools")
def home_travel_tools():
    return render_template("home_travel_tools.html", category="home")


@app.route("/travel-tools")
def travel_tools():
    return render_template("home_travel_tools.html", category="travel")


@app.route("/student-tools")
def student_tools():
    return render_template("student_tools.html")


@app.route("/privacy-dev-tools")
@app.route("/privacy-dev-tools/<tool_id>")
def privacy_dev_tools(tool_id=None):
    if tool_id in SOCIAL_IDENTITY_TOOL_IDS:
        return redirect(url_for("social_identity_tool", tool_id=tool_id))
    return render_template("privacy_dev_tools.html", tool_id=tool_id, social_only=False)


SOCIAL_IDENTITY_TOOLS = [
    ("social-universal", "Universal Social Profile Exporter", "Prepare one image for profile pictures across nine social platforms.", "bi-person-bounding-box"),
    ("social-brand-kit", "Social Media Brand Kit Generator", "Export a matching profile image, banner and brand color guide.", "bi-palette2"),
    ("social-bio-card", "Social Bio Card Generator", "Turn a name, username, bio and links into a shareable card image.", "bi-person-vcard"),
    ("instagram-grid", "Instagram Grid Preview Studio", "Arrange 9, 12 or 15 photos, reorder them and export feed tiles.", "bi-grid-3x3-gap"),
    ("instagram-puzzle", "Instagram 3×3 Puzzle Maker", "Split one image into nine ordered square tiles in a ZIP.", "bi-grid-3x3"),
    ("gaming-avatar", "Gaming Profile Maker", "Create a custom gamer avatar with name, clan tag and game label.", "bi-controller"),
    ("social-headshot", "Professional Headshot Maker", "Frame and tone-adjust a photo for professional profile use.", "bi-person-square"),
    ("student-id", "Student ID / Profile Maker", "Create a printable student card from supplied details and a photo.", "bi-mortarboard"),
    ("avatar-studio", "Avatar Studio", "Create an initials-based avatar without uploading a photo.", "bi-emoji-smile"),
    ("username-identity", "Username + Profile Identity Generator", "Generate handle ideas, a display name and a concise profile bio.", "bi-at"),
    ("profile-audit", "Social Profile Audit", "Review profile details with transparent, actionable checklist items.", "bi-clipboard2-check"),
    ("identity-forge", "Social Identity Forge", "Bundle platform profile images, an identity card and brand guide.", "bi-stars"),
]
SOCIAL_IDENTITY_TOOL_IDS = {tool[0] for tool in SOCIAL_IDENTITY_TOOLS}


@app.route("/social-identity")
def social_identity_studio():
    return render_template("social_identity.html", social_tools=SOCIAL_IDENTITY_TOOLS)


@app.route("/social-identity/<tool_id>")
def social_identity_tool(tool_id):
    if tool_id not in SOCIAL_IDENTITY_TOOL_IDS:
        return redirect(url_for("social_identity_studio"))
    return render_template("privacy_dev_tools.html", tool_id=tool_id, social_only=True)


@app.route("/workflow-studio")
def workflow_studio():
    return render_template("workflow_studio.html")


@app.route("/life-admin")
def life_admin_studio():
    return render_template("life_admin.html")


@app.route("/api/emergency-qr", methods=["POST"])
def create_emergency_qr():
    body = request.get_json(silent=True) or {}
    supplied_data = body.get("data")
    if not isinstance(supplied_data, dict) or len(supplied_data) > len(EMERGENCY_QR_FIELDS):
        return jsonify({"success": False, "message": "Select at least one supported emergency field."}), 400

    selected_data = {}
    for key, value in supplied_data.items():
        if key not in EMERGENCY_QR_FIELDS or not isinstance(value, str) or len(value) > 500:
            return jsonify({"success": False, "message": "The selected emergency information is invalid."}), 400
        if value.strip():
            selected_data[key] = value.strip()
    if not selected_data:
        return jsonify({"success": False, "message": "Select at least one non-empty field to share."}), 400

    ttl = body.get("ttl")
    if isinstance(ttl, bool) or ttl not in {3600, 21600, 86400, 604800, 2592000}:
        return jsonify({"success": False, "message": "Choose a supported expiry between one hour and 30 days."}), 400

    token = secrets.token_urlsafe(24)
    revoke_key = secrets.token_urlsafe(32)
    nonce = secrets.token_bytes(12)
    ciphertext = AESGCM(_emergency_qr_key()).encrypt(
        nonce, json.dumps(selected_data, ensure_ascii=True).encode("utf-8"), token.encode("ascii")
    )
    expires_at = dt.datetime.now(dt.timezone.utc) + dt.timedelta(seconds=ttl)
    connection = _emergency_qr_db()
    try:
        connection.execute(
            "INSERT INTO emergency_qr_shares (token, nonce, ciphertext, expires_at, revoke_hash) VALUES (?, ?, ?, ?, ?)",
            (token, nonce, ciphertext, expires_at.isoformat(), hashlib.sha256(revoke_key.encode("ascii")).hexdigest()),
        )
        connection.commit()
    finally:
        connection.close()

    share_url = url_for("emergency_qr_view", token=token, _external=True)
    qr_image = qrcode.make(share_url, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=8, border=2)
    qr_buffer = io.BytesIO()
    qr_image.save(qr_buffer, format="PNG")
    return jsonify({
        "success": True,
        "url": share_url,
        "qrDataUrl": "data:image/png;base64," + base64.b64encode(qr_buffer.getvalue()).decode("ascii"),
        "revokeKey": revoke_key,
        "expiresAt": expires_at.isoformat(),
    }), 201


@app.route("/api/emergency-qr/<token>/revoke", methods=["POST"])
def revoke_emergency_qr(token):
    body = request.get_json(silent=True) or {}
    revoke_key = body.get("revokeKey", "")
    if not isinstance(revoke_key, str) or len(revoke_key) > 100:
        return jsonify({"success": False, "message": "A valid revoke key is required."}), 400

    connection = _emergency_qr_db()
    try:
        row = connection.execute(
            "SELECT revoke_hash, revoked FROM emergency_qr_shares WHERE token = ?", (token,)
        ).fetchone()
        if not row or not hmac.compare_digest(row[0], hashlib.sha256(revoke_key.encode("ascii", "ignore")).hexdigest()):
            return jsonify({"success": False, "message": "Share or revoke key not found."}), 404
        if not row[1]:
            connection.execute("UPDATE emergency_qr_shares SET revoked = 1 WHERE token = ?", (token,))
            connection.commit()
    finally:
        connection.close()
    return jsonify({"success": True})


@app.route("/emergency-qr/<token>")
def emergency_qr_view(token):
    connection = _emergency_qr_db()
    try:
        row = connection.execute(
            "SELECT nonce, ciphertext, expires_at, revoked FROM emergency_qr_shares WHERE token = ?", (token,)
        ).fetchone()
    finally:
        connection.close()

    card = None
    status = "This emergency card is unavailable, expired, or has been revoked."
    response_code = 410
    if row and not row[3] and dt.datetime.now(dt.timezone.utc) < dt.datetime.fromisoformat(row[2]):
        try:
            stored = json.loads(AESGCM(_emergency_qr_key()).decrypt(row[0], row[1], token.encode("ascii")))
        except Exception:
            stored = {}
        grouped = {}
        for key, value in stored.items():
            field = EMERGENCY_QR_FIELDS.get(key)
            if field and isinstance(value, str) and value.strip():
                label, group = field
                grouped.setdefault(group, []).append({"label": label, "value": value})
        if grouped:
            card = [{"name": name, "fields": fields} for name, fields in grouped.items()]
            status = ""
            response_code = 200

    response = make_response(render_template("emergency_qr_view.html", card=card, status=status), response_code)
    response.headers["Cache-Control"] = "no-store, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["X-Robots-Tag"] = "noindex, nofollow, noarchive"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.route("/real-world-tools")
def real_world_tools():
    return render_template("real_world_tools.html", tool_id=None)


@app.route("/real-world-tools/<tool_id>")
def real_world_tool(tool_id):
    return render_template("real_world_tools.html", tool_id=tool_id)


@app.route("/device-lab")
def device_lab():
    return render_template("device_lab.html")


@app.route("/media-studio")
def media_studio():
    return render_template("media_studio.html")


@app.route("/qr-studio")
def qr_studio():
    qr_tool = _qr_tool_from_request()
    return render_template("qr_studio.html", qr_tool=qr_tool)


def _qr_tool_from_request():
    panel = request.args.get("panel", "")
    tool_type = request.args.get("type", "")
    title = request.args.get("title", "").strip()
    panels = {"createPanel", "scanPanel", "qualityPanel", "batchPanel", "businessPanel", "extrasPanel"}
    tool_types = {"url", "smartlink", "text", "phone", "email", "sms", "wifi", "vcard", "location", "event", "whatsapp", "upi", "social", "app", "json", "custom", "gs1"}
    if panel not in panels:
        return None
    return {
        "panel": panel,
        "type": tool_type if tool_type in tool_types else "",
        "title": title[:100] or "QR & Barcode Studio",
    }


@app.route("/api/security/share", methods=["POST"])
def security_share():
    data = request.get_json(silent=True) or {}
    encrypted_payload = data.get("payload", "")
    if not encrypted_payload or len(encrypted_payload) > 25 * 1024 * 1024:
        return jsonify({"success": False, "message": "Encrypted payload is missing or too large."}), 400
    token = secrets.token_urlsafe(32)
    now = dt.datetime.now(dt.timezone.utc)
    expires_at = now + dt.timedelta(seconds=max(600, min(int(data.get("ttl", 3600)), 604800)))
    SECURE_SHARES[token] = {"payload": encrypted_payload, "created": now.isoformat(), "expires": expires_at.isoformat(), "views": 0, "max_views": max(1, min(int(data.get("max_views", 1)), 100)), "burn": bool(data.get("burn", True)), "revoked": False, "last_access": None}
    return jsonify({"success": True, "token": token, "expires": expires_at.isoformat()})


def _secure_room_db():
    os.makedirs(app.instance_path, exist_ok=True)
    connection = sqlite3.connect(os.path.join(app.instance_path, "secure_share_rooms.sqlite3"))
    connection.execute("""CREATE TABLE IF NOT EXISTS secure_share_rooms (
        token TEXT PRIMARY KEY,
        encrypted_payload BLOB,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        owner_key_hash TEXT NOT NULL,
        allow_download INTEGER NOT NULL DEFAULT 0,
        watermark INTEGER NOT NULL DEFAULT 1,
        revoked INTEGER NOT NULL DEFAULT 0,
        purpose TEXT,
        recipient TEXT,
        watermark_text TEXT,
        document_count INTEGER NOT NULL DEFAULT 0
    )""")
    columns = {row[1] for row in connection.execute("PRAGMA table_info(secure_share_rooms)").fetchall()}
    for name, definition in {
        "purpose": "TEXT",
        "recipient": "TEXT",
        "watermark_text": "TEXT",
        "document_count": "INTEGER NOT NULL DEFAULT 0",
    }.items():
        if name not in columns:
            connection.execute(f"ALTER TABLE secure_share_rooms ADD COLUMN {name} {definition}")
    connection.execute("""CREATE TABLE IF NOT EXISTS secure_share_room_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT NOT NULL,
        happened_at TEXT NOT NULL,
        event TEXT NOT NULL,
        FOREIGN KEY(token) REFERENCES secure_share_rooms(token)
    )""")
    connection.commit()
    return connection


def _secure_room_log(connection, token, event, happened_at=None):
    connection.execute(
        "INSERT INTO secure_share_room_log (token, happened_at, event) VALUES (?, ?, ?)",
        (token, (happened_at or dt.datetime.now(dt.timezone.utc)).isoformat(), event),
    )


def _secure_room_purge_expired(connection, now=None):
    now = now or dt.datetime.now(dt.timezone.utc)
    expired = connection.execute(
        "SELECT token FROM secure_share_rooms WHERE encrypted_payload IS NOT NULL AND (revoked = 1 OR expires_at <= ?)",
        (now.isoformat(),),
    ).fetchall()
    if expired:
        connection.executemany(
            "UPDATE secure_share_rooms SET encrypted_payload = NULL WHERE token = ?",
            [(row[0],) for row in expired],
        )
        for (token,) in expired:
            _secure_room_log(connection, token, "Expired and encrypted bundle purged", now)


@app.route("/api/security/rooms", methods=["POST"])
def create_secure_share_room():
    data = request.get_json(silent=True) or {}
    encrypted_payload = data.get("payload")
    if not isinstance(encrypted_payload, str) or not encrypted_payload or len(encrypted_payload) > 30 * 1024 * 1024:
        return jsonify({"success": False, "message": "Encrypted document bundle is missing or too large."}), 400
    ttl = data.get("ttl")
    if isinstance(ttl, bool) or ttl not in {3600, 86400, 604800, 2592000}:
        return jsonify({"success": False, "message": "Choose an expiry of 1 hour, 24 hours, 7 days, or 30 days."}), 400
    allow_download = data.get("allowDownload", False)
    watermark = data.get("watermark", True)
    if not isinstance(allow_download, bool) or not isinstance(watermark, bool):
        return jsonify({"success": False, "message": "Room access settings are invalid."}), 400

    purpose = re.sub(r"\s+", " ", str(data.get("purpose", "")).strip())[:160]
    recipient = re.sub(r"\s+", " ", str(data.get("recipient", "")).strip())[:120]
    watermark_text = re.sub(r"\s+", " ", str(data.get("watermarkText", "")).strip())[:100]
    documents = data.get("documents")
    if documents is None:
        documents = []
    if not isinstance(documents, list):
        return jsonify({"success": False, "message": "Document bundle must be a list."}), 400

    now = dt.datetime.now(dt.timezone.utc)
    expires_at = now + dt.timedelta(seconds=ttl)
    token = secrets.token_urlsafe(32)
    owner_key = secrets.token_urlsafe(32)
    view_key = secrets.token_urlsafe(32)
    share_url = url_for("secure_share_room_view", token=token, _external=True) + "#key=" + view_key
    qr = qrcode.make(share_url, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=8, border=2)
    qr_buffer = io.BytesIO()
    qr.save(qr_buffer, format="PNG")

    connection = _secure_room_db()
    try:
        _secure_room_purge_expired(connection, now)
        connection.execute(
            "INSERT INTO secure_share_rooms (token, encrypted_payload, created_at, expires_at, owner_key_hash, allow_download, watermark, purpose, recipient, watermark_text, document_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                token,
                encrypted_payload.encode("ascii"),
                now.isoformat(),
                expires_at.isoformat(),
                hashlib.sha256(owner_key.encode("ascii")).hexdigest(),
                int(allow_download),
                int(watermark),
                purpose or None,
                recipient or None,
                watermark_text or None,
                max(0, min(len(documents), 200)),
            ),
        )
        _secure_room_log(connection, token, "Room created", now)
        connection.commit()
    finally:
        connection.close()

    return jsonify({
        "success": True,
        "token": token,
        "url": share_url,
        "qrDataUrl": "data:image/png;base64," + base64.b64encode(qr_buffer.getvalue()).decode("ascii"),
        "createdAt": now.isoformat(),
        "expiresAt": expires_at.isoformat(),
        "ownerKey": owner_key,
        "viewKey": view_key,
        "purpose": purpose or None,
        "recipient": recipient or None,
        "watermarkText": watermark_text or None,
    }), 201


@app.route("/api/security/rooms/<token>", methods=["GET"])
def access_secure_share_room(token):
    connection = _secure_room_db()
    try:
        now = dt.datetime.now(dt.timezone.utc)
        _secure_room_purge_expired(connection, now)
        row = connection.execute(
            "SELECT encrypted_payload, expires_at, allow_download, watermark, revoked, purpose, recipient, watermark_text, document_count FROM secure_share_rooms WHERE token = ?",
            (token,),
        ).fetchone()
        if not row:
            return jsonify({"success": False, "message": "Share room not found."}), 404
        if row[4] or row[0] is None or now >= dt.datetime.fromisoformat(row[1]):
            connection.commit()
            return jsonify({"success": False, "message": "This share room has expired or been revoked."}), 410
        _secure_room_log(connection, token, "Link opened", now)
        connection.commit()
        return jsonify({
            "success": True,
            "payload": row[0].decode("ascii"),
            "expiresAt": row[1],
            "allowDownload": bool(row[2]),
            "watermark": bool(row[3]),
            "purpose": row[5],
            "recipient": row[6],
            "watermarkText": row[7],
            "documentCount": row[8],
        })
    finally:
        connection.close()


def _secure_room_owner_authorized(connection, token, owner_key):
    row = connection.execute(
        "SELECT owner_key_hash FROM secure_share_rooms WHERE token = ?", (token,)
    ).fetchone()
    return bool(row and isinstance(owner_key, str) and hmac.compare_digest(
        row[0], hashlib.sha256(owner_key.encode("utf-8")).hexdigest()
    ))


@app.route("/api/security/rooms/<token>/log", methods=["POST"])
def secure_share_room_log(token):
    data = request.get_json(silent=True) or {}
    connection = _secure_room_db()
    try:
        if not _secure_room_owner_authorized(connection, token, data.get("ownerKey", "")):
            return jsonify({"success": False, "message": "Room or owner key not found."}), 404
        entries = connection.execute(
            "SELECT happened_at, event FROM secure_share_room_log WHERE token = ? ORDER BY id DESC LIMIT 100",
            (token,),
        ).fetchall()
        return jsonify({"success": True, "entries": [{"at": at, "event": event} for at, event in entries]})
    finally:
        connection.close()


@app.route("/api/security/rooms/<token>/revoke", methods=["POST"])
def revoke_secure_share_room(token):
    data = request.get_json(silent=True) or {}
    connection = _secure_room_db()
    try:
        if not _secure_room_owner_authorized(connection, token, data.get("ownerKey", "")):
            return jsonify({"success": False, "message": "Room or owner key not found."}), 404
        now = dt.datetime.now(dt.timezone.utc)
        connection.execute("UPDATE secure_share_rooms SET revoked = 1, encrypted_payload = NULL WHERE token = ?", (token,))
        _secure_room_log(connection, token, "Room revoked and encrypted bundle purged", now)
        connection.commit()
        return jsonify({"success": True})
    finally:
        connection.close()


@app.route("/security-room/<token>")
def secure_share_room_view(token):
    return render_template("security/share_room_view.html", room_token=token)


@app.route("/api/security/share/<token>", methods=["GET", "DELETE"])
def security_share_access(token):
    share = SECURE_SHARES.get(token)
    if not share:
        return jsonify({"success": False, "message": "Share not found."}), 404
    if request.method == "DELETE":
        share["revoked"] = True
        return jsonify({"success": True})
    now = dt.datetime.now(dt.timezone.utc)
    if share["revoked"] or now >= dt.datetime.fromisoformat(share["expires"]) or share["views"] >= share["max_views"]:
        return jsonify({"success": False, "message": "Share expired, revoked, or already viewed."}), 410
    share["views"] += 1
    share["last_access"] = now.isoformat()
    payload = {"success": True, "payload": share["payload"], "expires": share["expires"], "views": share["views"], "remaining": max(0, share["max_views"] - share["views"])}
    if share["burn"] or share["views"] >= share["max_views"]:
        share["revoked"] = True
    return jsonify(payload)


@app.route("/api/security/rdap", methods=["POST"])
def security_rdap():
    data = request.get_json(silent=True) or {}
    domain = (data.get("domain") or "").strip().lower().removeprefix("https://").removeprefix("http://").split("/", 1)[0]
    if not domain or "." not in domain or any(c.isspace() for c in domain):
        return jsonify({"success": False, "message": "Enter a valid domain name."}), 400
    try:
        response = requests.get(f"https://rdap.org/domain/{domain}", headers={"Accept": "application/rdap+json"}, timeout=12)
        response.raise_for_status()
        result = response.json()
        events = {event.get("eventAction"): event.get("eventDate") for event in result.get("events", [])}
        nameservers = [item.get("ldhName") for item in result.get("nameservers", []) if item.get("ldhName")]
        return jsonify({"success": True, "data": {"domain": result.get("ldhName", domain), "status": result.get("status", []), "registrar": next((e.get("vcardArray", [None, []])[1] for e in result.get("entities", []) if "registrar" in e.get("roles", [])), []), "registered": events.get("registration"), "updated": events.get("last changed"), "expires": events.get("expiration"), "nameservers": nameservers, "dnssec": result.get("secureDNS", {}).get("delegationSigned", False), "rdap_url": response.url}})
    except Exception as exc:
        return jsonify({"success": False, "message": f"RDAP lookup failed: {exc}"}), 502


@app.route("/api/security/ip", methods=["POST"])
def security_ip():
    data = request.get_json(silent=True) or {}
    value = (data.get("ip") or data.get("domain") or "").strip()
    try:
        address = ipaddress.ip_address(value)
    except ValueError:
        try:
            value = socket.gethostbyname(value)
            address = ipaddress.ip_address(value)
        except Exception:
            return jsonify({"success": False, "message": "Enter a valid IPv4, IPv6, or resolvable domain."}), 400
    try:
        response = requests.get(f"https://rdap.org/ip/{address}", headers={"Accept": "application/rdap+json"}, timeout=12)
        response.raise_for_status()
        result = response.json()
        return jsonify({"success": True, "data": {"ip": str(address), "version": address.version, "private": address.is_private, "reserved": address.is_reserved, "bogon": address.is_private or address.is_reserved, "network": result.get("cidr", result.get("startAddress", "Unknown")), "name": result.get("name", "Unknown"), "country": result.get("country", "Unknown"), "registry": result.get("port43", "Unknown"), "rdap_url": response.url, "entities": result.get("entities", [])}})
    except Exception as exc:
        return jsonify({"success": False, "message": f"IP RDAP lookup failed: {exc}"}), 502


def _security_url(data):
    value = (data.get("url") or "").strip()
    if not value.startswith(("http://", "https://")):
        value = f"https://{value}"
    parsed = urlparse(value)
    if not parsed.hostname:
        raise ValueError("Enter a valid URL.")
    return value, parsed


@app.route("/api/security/headers", methods=["POST"])
def security_headers():
    try:
        value, parsed = _security_url(request.get_json(silent=True) or {})
        response = requests.get(value, timeout=12, allow_redirects=True, headers={"User-Agent": "Thakronix-Security-Scanner/1.0"})
        headers = {key.lower(): val for key, val in response.headers.items()}
        expected = ["content-security-policy", "strict-transport-security", "x-frame-options", "x-content-type-options", "referrer-policy", "permissions-policy"]
        checks = {key: headers.get(key) for key in expected}
        score = round(sum(bool(checks[key]) for key in expected) / len(expected) * 100)
        cookies = headers.get("set-cookie", "")
        return jsonify({"success": True, "data": {"url": value, "final_url": response.url, "status": response.status_code, "headers": checks, "cookies": {"secure": "secure" in cookies.lower(), "httponly": "httponly" in cookies.lower(), "samesite": "samesite" in cookies.lower()}, "score": score, "warnings": [f"Missing {key.upper()}" for key in expected if not checks[key]], "host": parsed.hostname}})
    except Exception as exc:
        return jsonify({"success": False, "message": f"Header scan failed: {exc}"}), 502


@app.route("/api/security/ssl", methods=["POST"])
def security_ssl():
    import ssl
    import datetime
    
    data = request.get_json(silent=True) or {}
    domain = (data.get("domain") or "").strip().split(":", 1)[0]
    if not domain:
        return jsonify({"success": False, "message": "Enter a domain."}), 400
    try:
        context = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=10) as raw:
            with context.wrap_socket(raw, server_hostname=domain) as connection:
                certificate = connection.getpeercert()
                expires = certificate.get("notAfter")
                expiry = datetime.datetime.strptime(expires, "%b %d %H:%M:%S %Y %Z") if expires else None
                return jsonify({"success": True, "data": {"domain": domain, "https": True, "tls": connection.version(), "issuer": dict(x[0] for x in certificate.get("issuer", [])), "subject": dict(x[0] for x in certificate.get("subject", [])), "expires": expires, "days_left": (expiry - datetime.datetime.utcnow()).days if expiry else None, "san": [value for item in certificate.get("subjectAltName", []) for value in item[1:]], "chain": "Validated by system trust store"}})
    except Exception as exc:
        return jsonify({"success": False, "message": f"TLS check failed: {exc}"}), 502


@app.route("/api/security/url-safety", methods=["POST"])
def security_url_safety():
    import ipaddress as ip_module
    try:
        value, parsed = _security_url(request.get_json(silent=True) or {})
        host = parsed.hostname or ""
        indicators = []
        try:
            ip_module.ip_address(host)
            indicators.append("IP-address URL")
        except ValueError:
            pass
        if parsed.scheme != "https": indicators.append("Not HTTPS")
        if any(word in value.lower() for word in ("login", "verify", "wallet", "password", "credential", "update-account")): indicators.append("Suspicious keyword")
        if len(host.split(".")) > 4: indicators.append("Unusually nested domain")
        shorteners = {"bit.ly", "t.co", "tinyurl.com", "goo.gl", "ow.ly", "is.gd"}
        if host in shorteners: indicators.append("URL shortener")
        response = requests.head(value, timeout=10, allow_redirects=True, headers={"User-Agent": "Thakronix-Security-Scanner/1.0"})
        classification = "Suspicious" if indicators else "Safe" if response.status_code < 400 else "Unknown"
        return jsonify({"success": True, "data": {"input": value, "final_url": response.url, "status": response.status_code, "redirects": len(response.history), "host": host, "indicators": indicators, "classification": classification}})
    except Exception as exc:
        return jsonify({"success": False, "message": f"URL scan failed: {exc}"}), 502


@app.route("/api/security/http-check", methods=["POST"])
def security_http_check():
    try:
        value, _ = _security_url(request.get_json(silent=True) or {})
        started = dt.datetime.now(dt.timezone.utc)
        response = requests.get(value, timeout=12, allow_redirects=True, headers={"User-Agent": "Thakronix-Security-Scanner/1.0"})
        elapsed = (dt.datetime.now(dt.timezone.utc) - started).total_seconds() * 1000
        return jsonify({"success": True, "data": {"status": response.status_code, "final_url": response.url, "redirects": [{"status": x.status_code, "url": x.url} for x in response.history], "milliseconds": round(elapsed), "https": response.url.startswith("https://"), "headers": dict(response.headers)}})
    except Exception as exc:
        return jsonify({"success": False, "message": f"HTTP check failed: {exc}"}), 502


@app.route("/api/security/cors", methods=["POST"])
def security_cors():
    try:
        value, _ = _security_url(request.get_json(silent=True) or {})
        origin = (request.get_json(silent=True) or {}).get("origin", "https://example.com")
        response = requests.options(value, headers={"Origin": origin, "Access-Control-Request-Method": "GET"}, timeout=12)
        headers = {key.lower(): val for key, val in response.headers.items() if key.lower().startswith("access-control-")}
        return jsonify({"success": True, "data": {"status": response.status_code, "headers": headers, "origin": origin, "credentials": headers.get("access-control-allow-credentials") == "true", "warning": "Wildcard origin with credentials is unsafe." if headers.get("access-control-allow-origin") == "*" and headers.get("access-control-allow-credentials") == "true" else "No obvious wildcard-credentials conflict observed."}})
    except Exception as exc:
        return jsonify({"success": False, "message": f"CORS check failed: {exc}"}), 502


@app.route("/image-tools")
def image_tools():
    return render_template("media_tools/index.html", media_tool_pages=MEDIA_TOOL_PAGES)


MEDIA_TOOL_PAGES = [
    {"endpoint": "media_image_converter", "name": "Image Converter", "icon": "bi-images", "description": "Convert, resize, and export multiple image formats."},
    {"endpoint": "media_image_to_pdf", "name": "Image to PDF", "icon": "bi-file-earmark-pdf", "description": "Build clean multi-page PDFs from images."},
    {"endpoint": "media_photo_collage", "name": "Photo Collage Maker", "icon": "bi-grid-3x3-gap", "description": "Create social-ready collage layouts."},
    {"endpoint": "media_profile_picture", "name": "Profile Picture Maker", "icon": "bi-person-circle", "description": "Make platform-ready profile images."},
    {"endpoint": "media_watermarker", "name": "Image Watermarker", "icon": "bi-droplet", "description": "Apply text watermarks with position and opacity controls."},
    {"endpoint": "media_text_to_image", "name": "Text to Image", "icon": "bi-type", "description": "Turn quotes and text into shareable graphics."},
    {"endpoint": "media_passport_photo", "name": "Passport Photo Maker", "icon": "bi-person-vcard", "description": "Create passport presets and print sheets."},
    {"endpoint": "media_image_url_downloader", "name": "Image URL Downloader", "icon": "bi-link-45deg", "description": "Preview and download direct image URLs."},
    {"endpoint": "media_video_library", "name": "Video Library", "icon": "bi-camera-video", "description": "Organize and play local video files."},
    {"endpoint": "media_photo_vibe_analyzer", "name": "Photo Vibe Analyzer", "icon": "bi-stars", "description": "Review visual quality and composition signals."},
    {"endpoint": "media_advanced_text_designer", "name": "Advanced Text Designer", "icon": "bi-palette", "description": "Create typography-led social graphics."},
    {"endpoint": "media_ai_object_remover", "name": "AI Object Remover", "icon": "bi-magic", "description": "Paint a mask and remove selected objects locally."},
    {"endpoint": "media_ai_background_studio", "name": "AI Background Studio", "icon": "bi-layers", "description": "Create transparent, solid, gradient and blurred backgrounds."},
    {"endpoint": "media_ai_upscaler", "name": "AI Image Upscaler", "icon": "bi-arrows-fullscreen", "description": "Upscale images with honest resolution and processing details."},
    {"endpoint": "media_generative_expand", "name": "Generative Expand", "icon": "bi-aspect-ratio", "description": "Expand a canvas for social and presentation ratios."},
    {"endpoint": "media_image_relight", "name": "Image Relighter", "icon": "bi-sun", "description": "Tune exposure, tone, temperature and virtual light."},
    {"endpoint": "media_photo_restoration", "name": "Photo Restoration Studio", "icon": "bi-image-alt", "description": "Repair faded photos with local restoration controls."},
    {"endpoint": "media_image_inspector", "name": "Image Inspector", "icon": "bi-search", "description": "Inspect dimensions, metadata, color and privacy signals."},
    {"endpoint": "media_image_vectorizer", "name": "Image to SVG", "icon": "bi-bezier2", "description": "Create a clean trace preview and export SVG code."},
    {"endpoint": "media_document_scanner", "name": "OCR Document Scanner", "icon": "bi-file-text", "description": "Extract editable text from screenshots and documents."},
    {"endpoint": "media_screenshot_beautifier", "name": "Screenshot Beautifier", "icon": "bi-window", "description": "Frame screenshots for portfolios and presentations."},
    {"endpoint": "media_palette_extractor", "name": "Color Palette Extractor", "icon": "bi-palette2", "description": "Extract dominant colors and export CSS variables."},
    {"endpoint": "media_sprite_sheet", "name": "Sprite Sheet Generator", "icon": "bi-grid-3x3", "description": "Pack multiple images with JSON and CSS coordinates."},
    {"endpoint": "media_image_sequence", "name": "Image Sequence Animator", "icon": "bi-film", "description": "Preview image sequences and export browser-supported WebM."},
    {"endpoint": "media_contact_sheet", "name": "Contact Sheet Maker", "icon": "bi-grid", "description": "Turn many photos into a labeled contact sheet."},
    {"endpoint": "media_pdf_tools_index", "name": "PDF & Document Tools", "icon": "bi-file-earmark-pdf", "description": "Merge, split, compress, extract, rotate and convert PDF documents."},
]

PDF_TOOL_PAGES = [
    {"endpoint": "media_pdf_to_jpg", "name": "PDF → JPG", "icon": "bi-file-earmark-image", "description": "Convert a PDF page into a JPG image."},
    {"endpoint": "media_jpg_to_pdf", "name": "JPG → PDF", "icon": "bi-file-earmark-pdf", "description": "Turn images into clean PDF pages."},
    {"endpoint": "media_pdf_merge", "name": "Merge PDFs", "icon": "bi-files", "description": "Combine multiple PDFs into one document."},
    {"endpoint": "media_pdf_split", "name": "Split PDF", "icon": "bi-scissors", "description": "Cut selected page ranges from a PDF."},
    {"endpoint": "media_pdf_compress", "name": "Compress PDF", "icon": "bi-arrows-angle-contract", "description": "Reduce PDF size with adjustable quality."},
    {"endpoint": "media_pdf_unlock", "name": "Unlock PDF", "icon": "bi-shield-lock", "description": "Remove password protection when available."},
    {"endpoint": "media_pdf_rotate", "name": "Rotate PDF", "icon": "bi-arrow-clockwise", "description": "Fix page orientation with 90° increments."},
    {"endpoint": "media_word_to_pdf", "name": "Word → PDF", "icon": "bi-filetype-doc", "description": "Convert DOCX files to PDF format."},
    {"endpoint": "media_pdf_to_word", "name": "PDF → Word", "icon": "bi-file-earmark-word", "description": "Export a PDF into DOCX text format."},
    {"endpoint": "media_pdf_to_text", "name": "PDF Text Extractor", "icon": "bi-text-paragraph", "description": "Read text content from uploaded PDFs."},
    {"endpoint": "media_ocr", "name": "OCR Image to Text", "icon": "bi-eye", "description": "Extract text directly from images."},
]


@app.route("/media-tools")
def media_tools_index():
    return render_template("media_tools/index.html", media_tool_pages=MEDIA_TOOL_PAGES)


@app.route("/audio-tools")
def audio_tools():
    return render_template("audio_tools.html")


@app.route("/media-tools/pdf-tools")
def media_pdf_tools_index():
    return render_template("media_tools/pdf_tools/index.html", pdf_tool_pages=PDF_TOOL_PAGES)


@app.route("/media-tools/image-converter")
def media_image_converter():
    return render_template("media_tools/image_converter.html")


@app.route("/media-tools/image-to-pdf")
def media_image_to_pdf():
    return render_template("media_tools/image_to_pdf.html")


@app.route("/media-tools/photo-collage")
def media_photo_collage():
    return render_template("media_tools/photo_collage.html")


@app.route("/media-tools/profile-picture")
def media_profile_picture():
    return render_template("media_tools/profile_picture.html")


@app.route("/media-tools/watermarker")
def media_watermarker():
    return render_template("media_tools/watermarker.html")


@app.route("/media-tools/text-to-image")
def media_text_to_image():
    return render_template("media_tools/text_to_image.html")


@app.route("/media-tools/passport-photo")
def media_passport_photo():
    return render_template("media_tools/passport_photo.html")


@app.route("/media-tools/image-url-downloader")
def media_image_url_downloader():
    return render_template("media_tools/image_url_downloader.html")


@app.route("/media-tools/video-library")
def media_video_library():
    return render_template("media_tools/video_library.html")


@app.route("/media-tools/photo-vibe-analyzer")
def media_photo_vibe_analyzer():
    return render_template("media_tools/photo_vibe_analyzer.html")


@app.route("/media-tools/advanced-text-designer")
def media_advanced_text_designer():
    return render_template("media_tools/advanced_text_designer.html")


def render_advanced_image_tool(tool_key, tool_number, title, description):
    return render_template("media_tools/advanced_image_tool.html", tool_key=tool_key, tool_number=tool_number, tool_title=title, tool_description=description)


@app.route("/media-tools/ai-object-remover")
def media_ai_object_remover():
    return render_advanced_image_tool("object-remover", 12, "AI Object Remover", "Use Smart Remove or a manual brush mask to clean selected regions.")


@app.route("/media-tools/ai-background-studio")
def media_ai_background_studio():
    return render_advanced_image_tool("background-studio", 13, "AI Background Studio", "Create a transparent, solid, gradient or blurred product background.")


@app.route("/media-tools/ai-upscaler")
def media_ai_upscaler():
    return render_advanced_image_tool("upscaler", 14, "AI Image Upscaler & Enhancer", "Resize and enhance locally with clear resolution reporting.")


@app.route("/media-tools/generative-expand")
def media_generative_expand():
    return render_advanced_image_tool("expand", 15, "Generative Expand / Outpainting", "Expand the canvas for common social and presentation ratios.")


@app.route("/media-tools/image-relighter")
def media_image_relight():
    return render_advanced_image_tool("relight", 16, "AI Image Relighter", "Tune exposure, tone, temperature and a local virtual-light effect.")


@app.route("/media-tools/photo-restoration")
def media_photo_restoration():
    return render_advanced_image_tool("restoration", 17, "Photo Restoration Studio", "Improve faded images with local contrast, denoise and sharpen controls.")


@app.route("/media-tools/image-inspector")
def media_image_inspector():
    return render_advanced_image_tool("inspector", 18, "Image Inspector & Privacy", "Inspect dimensions, format, color and browser-visible metadata.")


@app.route("/media-tools/image-vectorizer")
def media_image_vectorizer():
    return render_advanced_image_tool("vectorizer", 19, "Image to SVG / Vectorizer", "Create a simplified local trace preview and SVG export.")


@app.route("/media-tools/document-scanner")
def media_document_scanner():
    return render_advanced_image_tool("ocr", 20, "OCR & Document Scanner", "Extract editable text from an image through the existing OCR service.")


@app.route("/media-tools/screenshot-beautifier")
def media_screenshot_beautifier():
    return render_advanced_image_tool("screenshot", 21, "Screenshot Beautifier", "Frame and style screenshots for portfolios and presentations.")


@app.route("/media-tools/palette-extractor")
def media_palette_extractor():
    return render_advanced_image_tool("palette", 22, "Image Color Palette Extractor", "Extract dominant colors and export CSS variables or JSON.")


@app.route("/media-tools/sprite-sheet")
def media_sprite_sheet():
    return render_advanced_image_tool("sprite", 23, "Sprite Sheet Generator", "Pack image assets and export CSS and JSON coordinates.")


@app.route("/media-tools/image-sequence")
def media_image_sequence():
    return render_advanced_image_tool("sequence", 24, "Image Sequence to Animation", "Preview a sequence and export browser-supported WebM." )


@app.route("/media-tools/contact-sheet")
def media_contact_sheet():
    return render_advanced_image_tool("contact", 25, "Image Contact Sheet Maker", "Arrange many images into a labeled grid for export.")


@app.route("/media-tools/pdf-to-jpg")
def media_pdf_to_jpg():
    return render_template("media_tools/pdf_tools/pdf_to_jpg.html")


@app.route("/media-tools/jpg-to-pdf")
def media_jpg_to_pdf():
    return render_template("media_tools/pdf_tools/jpg_to_pdf.html")


@app.route("/media-tools/pdf-merge")
def media_pdf_merge():
    return render_template("media_tools/pdf_tools/merge.html")


@app.route("/media-tools/pdf-split")
def media_pdf_split():
    return render_template("media_tools/pdf_tools/split.html")


@app.route("/media-tools/pdf-compress")
def media_pdf_compress():
    return render_template("media_tools/pdf_tools/compress.html")


@app.route("/media-tools/pdf-unlock")
def media_pdf_unlock():
    return render_template("media_tools/pdf_tools/unlock.html")


@app.route("/media-tools/pdf-rotate")
def media_pdf_rotate():
    return render_template("media_tools/pdf_tools/rotate.html")


@app.route("/media-tools/word-to-pdf")
def media_word_to_pdf():
    return render_template("media_tools/pdf_tools/word_to_pdf.html")


@app.route("/media-tools/pdf-to-word")
def media_pdf_to_word():
    return render_template("media_tools/pdf_tools/pdf_to_word.html")


@app.route("/media-tools/pdf-to-text")
def media_pdf_to_text():
    return render_template("media_tools/pdf_tools/pdf_to_text.html")


@app.route("/media-tools/ocr")
def media_ocr():
    return render_template("media_tools/pdf_tools/ocr.html")


@app.route("/image-converter")
def image_converter():
    return render_template("media_tools/image_converter.html")


@app.route("/image-compressor")
def image_compressor():
    return render_template("image_compressor.html")


@app.route("/sketch")
def sketch():
    return render_template("sketch.html")


@app.route("/qr-generator")
def qr_generator():
    qr_tool = _qr_tool_from_request()
    return render_template("qr_studio.html", qr_tool=qr_tool)


@app.route("/pdf-tools")
def pdf_tools():
    return redirect(url_for("media_pdf_tools_index"))


@app.route("/youtube-downloader")
def youtube_downloader():
    return render_template("youtube_downloader.html")


# ==========================================
# PDF & DOCUMENT TOOLS
# ==========================================

@app.route("/api/pdf-to-jpg", methods=["POST"])
def api_pdf_to_jpg():
    file = request.files.get("pdf")
    if not file or file.filename == "":
        return jsonify({"success": False, "message": "Please upload a PDF file."}), 400

    try:
        pdf_bytes = file.read()
        jpg_bytes = pdf_to_jpg_bytes(pdf_bytes)
        return send_file(io.BytesIO(jpg_bytes), mimetype="image/jpeg", as_attachment=True, download_name="converted_page.jpg")
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500


@app.route("/api/jpg-to-pdf", methods=["POST"])
def api_jpg_to_pdf():
    file = request.files.get("image")
    if not file or file.filename == "":
        return jsonify({"success": False, "message": "Please upload an image file."}), 400

    try:
        pdf_bytes = jpg_to_pdf_bytes(file.read())
        return send_file(io.BytesIO(pdf_bytes), mimetype="application/pdf", as_attachment=True, download_name="converted.pdf")
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500


@app.route("/api/pdf-merge", methods=["POST"])
def api_pdf_merge():
    files = request.files.getlist("pdfs")
    if len(files) < 2:
        return jsonify({"success": False, "message": "Please upload at least two PDF files."}), 400

    try:
        merged = merge_pdf_bytes([file.read() for file in files if file and file.filename])
        return send_file(io.BytesIO(merged), mimetype="application/pdf", as_attachment=True, download_name="merged.pdf")
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500


@app.route("/api/pdf-split", methods=["POST"])
def api_pdf_split():
    file = request.files.get("pdf")
    if not file or file.filename == "":
        return jsonify({"success": False, "message": "Please upload a PDF file."}), 400

    try:
        start = parse_number(request.form.get("start_page", 1), "Start page", minimum=1, integer=True)
        end = parse_number(request.form.get("end_page", 1), "End page", minimum=1, integer=True)
        split_bytes = split_pdf_pages(file.read(), start, end)
        return send_file(io.BytesIO(split_bytes), mimetype="application/pdf", as_attachment=True, download_name="split.pdf")
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500


@app.route("/api/pdf-compress", methods=["POST"])
def api_pdf_compress():
    file = request.files.get("pdf")
    if not file or file.filename == "":
        return jsonify({"success": False, "message": "Please upload a PDF file."}), 400

    try:
        quality = parse_number(request.form.get("quality", 0.7), "Quality", minimum=0.4, maximum=1.0)
        compressed = compress_pdf_bytes(file.read(), quality=quality)
        return send_file(io.BytesIO(compressed), mimetype="application/pdf", as_attachment=True, download_name="compressed.pdf")
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500


@app.route("/api/pdf-unlock", methods=["POST"])
def api_pdf_unlock():
    file = request.files.get("pdf")
    if not file or file.filename == "":
        return jsonify({"success": False, "message": "Please upload a PDF file."}), 400

    try:
        password = request.form.get("password", "")
        unlocked = unlock_pdf_bytes(file.read(), password=password)
        return send_file(io.BytesIO(unlocked), mimetype="application/pdf", as_attachment=True, download_name="unlocked.pdf")
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500


@app.route("/api/pdf-rotate", methods=["POST"])
def api_pdf_rotate():
    file = request.files.get("pdf")
    if not file or file.filename == "":
        return jsonify({"success": False, "message": "Please upload a PDF file."}), 400

    try:
        angle = parse_number(request.form.get("angle", 90), "Rotation angle", integer=True)
        if angle % 90 != 0:
            raise ValueError("Rotation angle must be a multiple of 90 degrees.")
        rotated = rotate_pdf_pages(file.read(), angle=angle)
        return send_file(io.BytesIO(rotated), mimetype="application/pdf", as_attachment=True, download_name="rotated.pdf")
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500


@app.route("/api/word-to-pdf", methods=["POST"])
def api_word_to_pdf():
    file = request.files.get("docx")
    if not file or file.filename == "":
        return jsonify({"success": False, "message": "Please upload a Word document."}), 400

    try:
        pdf_bytes = word_to_pdf_bytes(file.read())
        return send_file(io.BytesIO(pdf_bytes), mimetype="application/pdf", as_attachment=True, download_name="converted.pdf")
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500


@app.route("/api/pdf-to-word", methods=["POST"])
def api_pdf_to_word():
    file = request.files.get("pdf")
    if not file or file.filename == "":
        return jsonify({"success": False, "message": "Please upload a PDF file."}), 400

    try:
        docx_bytes = pdf_to_word_bytes(file.read())
        return send_file(io.BytesIO(docx_bytes), mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document", as_attachment=True, download_name="converted.docx")
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500


@app.route("/api/pdf-to-text", methods=["POST"])
def api_pdf_to_text():
    file = request.files.get("pdf")
    if not file or file.filename == "":
        return jsonify({"success": False, "message": "Please upload a PDF file."}), 400

    try:
        text = pdf_to_text(file.read())
        return jsonify({"success": True, "text": text})
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500


@app.route("/api/ocr-image", methods=["POST"])
def api_ocr_image():
    file = request.files.get("image")
    if not file or file.filename == "":
        return jsonify({"success": False, "message": "Please upload an image file."}), 400

    try:
        text = image_to_text(file.read())
        return jsonify({"success": True, "text": text})
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500


# ==========================================
# YOUTUBE INFO API - FAST VERSION
# ==========================================

@app.route("/api/youtube-info", methods=["GET", "POST"])
def youtube_info():

    try:

        # --------------------------------------
        # GET URL FROM REQUEST
        # --------------------------------------

        if request.method == "POST":

            data = request.get_json(silent=True) or request.form or {}

            url = data.get("url", "").strip()

        else:

            url = request.args.get("url", "").strip()


        # --------------------------------------
        # VALIDATE URL
        # --------------------------------------

        if not url:

            return jsonify({
                "success": False,
                "message": "Please enter a YouTube URL."
            }), 400


        # --------------------------------------
        # EXTRACT VIDEO ID
        # --------------------------------------

        video_id = extract_video_id(url)

        if not video_id:

            return jsonify({
                "success": False,
                "message": "Invalid YouTube URL format."
            }), 400


        # --------------------------------------
        # DEFAULT DATA
        # --------------------------------------

        title = f"YouTube Video ({video_id})"

        channel = "YouTube Channel"

        duration = "N/A"

        views = 0

        description = ""

        hashtags = []

        thumbnail = (
            f"https://img.youtube.com/vi/"
            f"{video_id}/maxresdefault.jpg"
        )


        # ======================================
        # FIRST: FAST YT-DLP FETCH
        # ======================================

        info = fetch_youtube_metadata(url)


        # ======================================
        # IF YT-DLP WORKS
        # ======================================

        if info:

            title = info.get("title") or title

            channel = (
                info.get("uploader")
                or info.get("channel")
                or channel
            )

            duration = format_duration(
                info.get("duration")
            )

            views = info.get("view_count") or 0

            description = (
                info.get("description")
                or ""
            )

            hashtags = extract_all_hashtags(
                info,
                description
            )

            thumbnail = (
                info.get("thumbnail")
                or thumbnail
            )


        # ======================================
        # FAST FALLBACK
        # ======================================

        else:

            print(
                "yt-dlp unavailable/slow. "
                "Using oEmbed fallback."
            )

            fallback_data = fetch_oembed_metadata(
                video_id
            )

            title = fallback_data.get(
                "title",
                title
            )

            channel = fallback_data.get(
                "channel",
                channel
            )

            thumbnail = fallback_data.get(
                "thumbnail",
                thumbnail
            )

            hashtags = [
                "#youtube",
                "#video",
                "#trending"
            ]


        # ======================================
        # FINAL METADATA
        # ======================================

        metadata = {

            "title": title,

            "channel": channel,

            "duration": duration,

            "views": views,

            "description": (
                description
                if description
                else "No description available."
            ),

            "hashtags": (
                hashtags
                if hashtags
                else [
                    "#youtube",
                    "#video"
                ]
            ),

            "thumbnail": thumbnail,

            "embed_url": (
                f"https://www.youtube.com/embed/"
                f"{video_id}"
            ),

            "source_url": url
        }


        # ======================================
        # RETURN SUCCESS
        # ======================================

        return jsonify({
            "success": True,
            "data": metadata
        })


    except Exception as e:

        print(
            "Backend Error:",
            str(e)
        )

        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}"
        }), 500


# ==========================================
# FAIL-PROOF THUMBNAIL DOWNLOAD ROUTE
# ==========================================

@app.route("/api/youtube-audio", methods=["GET", "POST"])
def youtube_audio():
    """Download a YouTube video's audio and return it as a playable file."""
    data = request.get_json(silent=True) or request.form or request.args
    url = (data.get("url", "") or "").strip()
    requested_format = (data.get("format", "mp3") or "mp3").lower()
    quality = (data.get("quality", "192") or "192").strip()

    if not url or not extract_video_id(url):
        return jsonify({"success": False, "message": "Please enter a valid YouTube URL."}), 400

    if requested_format not in {"mp3", "m4a", "wav"}:
        return jsonify({"success": False, "message": "Unsupported audio format."}), 400

    if quality not in {"128", "192", "256", "320"}:
        quality = "192"

    ffmpeg_path = shutil.which("ffmpeg")
    if not ffmpeg_path:
        local_ffmpeg = r"C:\ffmpeg\ffmpeg-9.0.1-full_build-shared\bin\ffmpeg.exe"
        if os.path.isfile(local_ffmpeg):
            ffmpeg_path = local_ffmpeg
    if not ffmpeg_path:
        return jsonify({
            "success": False,
            "message": "MP3 conversion needs FFmpeg. Install FFmpeg and restart the app, then try again."
        }), 503

    temp_dir = tempfile.mkdtemp(prefix="thakronix-audio-")
    try:
        output_template = os.path.join(temp_dir, "%(id)s.%(ext)s")
        common_opts = {
            "format": "140/251/250/18",
            "outtmpl": output_template,
            "ffmpeg_location": ffmpeg_path,
            "noplaylist": True,
            "quiet": True,
            "no_warnings": True,
            "socket_timeout": 30,
            "retries": 2,
            "fragment_retries": 2,
            "forceipv4": True,
            "nocheckcertificate": True,
            "js_runtimes": {"node": {}},
            "remote_components": ["ejs:github"],
            "http_headers": {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/131.0.0.0 Safari/537.36"
                ),
                "Referer": "https://www.youtube.com/",
            },
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": requested_format,
                "preferredquality": quality,
            }],
        }
        cookie_file = os.environ.get("YOUTUBE_COOKIES_FILE", "")
        if cookie_file and os.path.isfile(cookie_file):
            common_opts["cookiefile"] = cookie_file

        last_error = None
        info = None
        attempts = [
            (client, None)
            for client in ("web_embedded", "mweb", "android_vr", "web")
        ]
        for player_client, cookie_browser in attempts:
            ydl_opts = {
                **common_opts,
                "extractor_args": {
                    "youtube": {"player_client": [player_client]}
                },
            }
            if cookie_browser:
                ydl_opts["cookiesfrombrowser"] = (cookie_browser,)
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                break
            except Exception as exc:
                last_error = exc

        if info is None:
            raise RuntimeError(
                "YouTube rejected the download request (403). "
                "Try another public video, or close Chrome/Edge and retry so yt-dlp can read its session cookies."
            ) from last_error

        video_id = info.get("id", "audio")
        title = info.get("title", "youtube-audio")

        output_path = os.path.join(temp_dir, f"{video_id}.{requested_format}")
        if not os.path.isfile(output_path):
            candidates = [
                os.path.join(temp_dir, name)
                for name in os.listdir(temp_dir)
                if os.path.isfile(os.path.join(temp_dir, name))
            ]
            if not candidates:
                raise FileNotFoundError("The audio file was not created. Make sure FFmpeg is installed.")
            output_path = candidates[0]

        @after_this_request
        def remove_temp_files(response):
            shutil.rmtree(temp_dir, ignore_errors=True)
            return response

        safe_title = re.sub(r"[^a-zA-Z0-9._ -]", "", title).strip() or "youtube-audio"
        return send_file(
            output_path,
            mimetype=f"audio/{requested_format}",
            as_attachment=True,
            download_name=f"{safe_title}.{requested_format}",
        )
    except Exception as exc:
        shutil.rmtree(temp_dir, ignore_errors=True)
        return jsonify({"success": False, "message": str(exc)}), 500

@app.route(
    "/api/download-thumbnail",
    methods=["GET", "POST"]
)

@app.route(
    "/api/youtube-thumbnail",
    methods=["GET", "POST"]
)

@app.route(
    "/api/youtube-download",
    methods=["GET", "POST"]
)

def download_thumbnail():

    try:

        url = ""

        # --------------------------------------
        # GET URL
        # --------------------------------------

        if request.method == "POST":

            data = (
                request.get_json(silent=True)
                or request.form
                or {}
            )

            url = (
                data.get("url", "").strip()
                or
                data.get(
                    "thumbnail_url",
                    ""
                ).strip()
            )

        else:

            url = (
                request.args.get(
                    "url",
                    ""
                ).strip()
                or
                request.args.get(
                    "thumbnail_url",
                    ""
                ).strip()
            )


        # --------------------------------------
        # VALIDATE
        # --------------------------------------

        if not url:

            return jsonify({
                "success": False,
                "message": "YouTube URL missing."
            }), 400

        if request.path == "/api/youtube-download":
            try:
                host = _download_host(url)
            except ValueError as exc:
                return jsonify({
                    "success": False,
                    "message": str(exc)
                }), 400
            if host not in {"youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"}:
                return jsonify({
                    "success": False,
                    "message": "please provide a valid youtube url."
                }), 400
            authorized = str((request.get_json(silent=True) or request.form or {}).get("authorized", "")).lower() in {"1", "true", "yes"}
            if not authorized:
                return jsonify({
                    "success": False,
                    "message": "permission is required before downloading public media."
                }), 400

        video_id = extract_video_id(url)

        if not video_id:

            return jsonify({
                "success": False,
                "message": "Invalid YouTube URL."
            }), 400


        # --------------------------------------
        # QUALITY LIST
        # --------------------------------------

        quality_urls = [

            f"https://img.youtube.com/vi/"
            f"{video_id}/maxresdefault.jpg",

            f"https://img.youtube.com/vi/"
            f"{video_id}/sddefault.jpg",

            f"https://img.youtube.com/vi/"
            f"{video_id}/hqdefault.jpg",

            f"https://img.youtube.com/vi/"
            f"{video_id}/mqdefault.jpg",

            f"https://img.youtube.com/vi/"
            f"{video_id}/default.jpg"

        ]


        headers = {

            "User-Agent": (
                "Mozilla/5.0 "
                "(Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 "
                "(KHTML, like Gecko) "
                "Chrome/121.0.0.0 "
                "Safari/537.36"
            )

        }


        img_data = None


        # --------------------------------------
        # TRY EACH QUALITY
        # --------------------------------------

        for img_url in quality_urls:

            try:

                res = requests.get(
                    img_url,
                    headers=headers,
                    timeout=3
                )

                if (
                    res.status_code == 200
                    and len(res.content) > 3000
                ):

                    img_data = res.content

                    break

            except Exception:

                continue


        # --------------------------------------
        # LAST FALLBACK
        # --------------------------------------

        if not img_data:

            try:

                res = requests.get(
                    quality_urls[2],
                    headers=headers,
                    timeout=3
                )

                img_data = res.content

            except Exception as e:

                return jsonify({
                    "success": False,
                    "message": (
                        "Unable to download thumbnail: "
                        f"{str(e)}"
                    )
                }), 500


        # --------------------------------------
        # SEND FILE
        # --------------------------------------

        buffer = io.BytesIO(
            img_data
        )

        buffer.seek(0)


        return send_file(

            buffer,

            mimetype="image/jpeg",

            as_attachment=True,

            download_name=(
                f"thumbnail_{video_id}.jpg"
            )

        )


    except Exception as e:

        return jsonify({

            "success": False,

            "message": (
                "Thumbnail Download Error: "
                f"{str(e)}"
            )

        }), 500


# ==========================================
# EXPORT HASHTAGS & DESCRIPTION (.TXT FILE)
# ==========================================

@app.route(
    "/api/youtube-export",
    methods=["GET", "POST"]
)

def youtube_export():

    try:

        url = (
            request.args.get(
                "url",
                ""
            ).strip()
            or
            request.form.get(
                "url",
                ""
            ).strip()
        )


        if (
            not url
            and request.is_json
        ):

            data = (
                request.get_json(
                    silent=True
                )
                or {}
            )

            url = data.get(
                "url",
                ""
            ).strip()


        if not url:

            return jsonify({

                "success": False,

                "message":
                    "YouTube URL missing."

            }), 400


        video_id = extract_video_id(
            url
        )


        title = "YouTube Video"

        channel = "N/A"

        description = ""

        hashtags = []


        # ======================================
        # FAST METADATA FETCH
        # ======================================

        info = fetch_youtube_metadata(
            url
        )


        if info:

            title = (
                info.get(
                    "title"
                )
                or title
            )

            channel = (
                info.get(
                    "uploader"
                )
                or info.get(
                    "channel"
                )
                or channel
            )

            description = (
                info.get(
                    "description"
                )
                or ""
            )

            hashtags = extract_all_hashtags(
                info,
                description
            )


        # ======================================
        # FALLBACK
        # ======================================

        else:

            if video_id:

                fallback_data = (
                    fetch_oembed_metadata(
                        video_id
                    )
                )

                title = (
                    fallback_data.get(
                        "title",
                        title
                    )
                )

                channel = (
                    fallback_data.get(
                        "channel",
                        channel
                    )
                )

            hashtags = [
                "#youtube",
                "#video",
                "#trending"
            ]


        # ======================================
        # HASHTAGS
        # ======================================

        tags_str = (
            " ".join(hashtags)
            if isinstance(
                hashtags,
                list
            )
            else str(hashtags)
        )


        # ======================================
        # EXPORT CONTENT
        # ======================================

        content = (

            "========================================\n"

            "YOUTUBE METADATA & HASHTAGS EXPORT\n"

            "========================================\n\n"

            f"TITLE      : {title}\n"

            f"CHANNEL    : {channel}\n"

            f"URL        : {url}\n"

            f"VIDEO ID   : "
            f"{video_id if video_id else 'N/A'}\n"

            f"HASHTAGS   : {tags_str}\n\n"

            "----------------------------------------\n"

            "FULL DESCRIPTION:\n"

            "----------------------------------------\n"

            f"{description if description else 'No description available.'}\n\n"

            "========================================\n"

        )


        buffer = io.BytesIO(

            content.encode(
                "utf-8"
            )

        )

        buffer.seek(0)


        return send_file(

            buffer,

            as_attachment=True,

            download_name=(

                f"youtube-info-"
                f"{video_id if video_id else 'export'}.txt"

            ),

            mimetype="text/plain"

        )


    except Exception as e:

        return jsonify({

            "success": False,

            "message":
                f"Export Error: {str(e)}"

        }), 500


# ============================
# CONVERTER & COMPRESSOR TOOLS
# ============================

@app.route(
    "/convert-image",
    methods=["POST"]
)

def convert_image():

    try:

        if "image" not in request.files:

            return jsonify({

                "success": False,

                "message":
                    "No image selected."

            }), 400


        file = request.files[
            "image"
        ]


        if (
            file.filename == ""
            or not allowed_file(
                file.filename
            )
        ):

            return jsonify({

                "success": False,

                "message":
                    "Invalid image file."

            }), 400


        target_format = (

            request.form.get(
                "format",
                "PNG"
            ).upper()

        )


        output = io.BytesIO()


        if target_format == "JPEG":

            if image.mode in (
                "RGBA",
                "P"
            ):

                image = image.convert(
                    "RGB"
                )


            image.save(

                output,

                format="JPEG",

                quality=90,

                optimize=True

            )


            extension = "jpg"


        elif target_format == "WEBP":

            image.save(

                output,

                format="WEBP",

                quality=90

            )


            extension = "webp"


        else:

            image.save(

                output,

                format="PNG",

                optimize=True

            )


            extension = "png"


        output.seek(0)


        response = send_file(

            output,

            mimetype=(
                f"image/{extension}"
            ),

            as_attachment=True,

            download_name=(

                f"converted_"
                f"{uuid.uuid4().hex[:8]}."
                f"{extension}"

            )

        )


    except Exception as e:

        print(
            "Image Conversion Error:",
            e
        )

        return jsonify({

            "success": False,

            "message":
                "Conversion error."

        }), 500


# ==========================================
# ADVANCED IMAGE TOOLS
# ==========================================

@app.route("/api/background-remove", methods=["POST"])
def api_background_remove():
    try:
        if "image" not in request.files:
            return jsonify({"success": False, "message": "No image selected."}), 400

        file = request.files["image"]
        if file.filename == "" or not allowed_file(file.filename):
            return jsonify({"success": False, "message": "Invalid image file."}), 400

        image = Image.open(io.BytesIO(file.read())).convert("RGBA")
        threshold = parse_number(request.form.get("threshold", 245), "Threshold", minimum=0, maximum=255, integer=True)
        result = remove_background(image, threshold)

        buffer = io.BytesIO()
        result.save(buffer, format="PNG")
        buffer.seek(0)

        return send_file(buffer, mimetype="image/png", as_attachment=True, download_name="background_removed.png")
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    except Exception as e:
        return jsonify({"success": False, "message": f"Background removal error: {str(e)}"}), 500


@app.route("/api/image-blur", methods=["POST"])
def api_image_blur():
    try:
        if "image" not in request.files:
            return jsonify({"success": False, "message": "No image selected."}), 400

        file = request.files["image"]
        if file.filename == "" or not allowed_file(file.filename):
            return jsonify({"success": False, "message": "Invalid image file."}), 400

        image = Image.open(io.BytesIO(file.read()))
        radius = parse_number(request.form.get("radius", 8.0), "Blur radius", minimum=0, maximum=100)
        if image.mode in ("RGBA", "LA", "P"):
            image = image.convert("RGBA")
        blurred = image.filter(ImageFilter.GaussianBlur(radius=radius))

        buffer = io.BytesIO()
        blurred.save(buffer, format="PNG")
        buffer.seek(0)

        return send_file(buffer, mimetype="image/png", as_attachment=True, download_name="blurred_image.png")
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    except Exception as e:
        return jsonify({"success": False, "message": f"Blur error: {str(e)}"}), 500


# ==========================================
# IMAGE COMPRESSOR
# ==========================================

@app.route(
    "/compress-image",
    methods=["POST"]
)

def compress_image():

    try:

        if "image" not in request.files:

            return jsonify({

                "success": False,

                "message":
                    "No image selected."

            }), 400


        file = request.files[
            "image"
        ]


        original_bytes = file.read()
        image = Image.open(io.BytesIO(original_bytes))
        target_format = request.form.get("format", "JPEG").upper()
        if target_format == "JPG":
            target_format = "JPEG"
        if target_format not in {"JPEG", "PNG", "WEBP"}:
            return jsonify({"success": False, "message": "Unsupported output format."}), 400
        quality = parse_number(request.form.get("quality", 80), "Quality", minimum=10, maximum=100, integer=True)
        target_size = parse_target_size(request.form.get("target_size", ""))


        if image.mode in (
            "RGBA",
            "P"
        ):

            image = image.convert(
                "RGB"
            )


        output = io.BytesIO()
        save_options = {"format": target_format, "optimize": True}
        if target_format in {"JPEG", "WEBP"}:
            save_options["quality"] = quality
        image.save(output, **save_options)

        if target_size and output.tell() > target_size and target_format in {"JPEG", "WEBP"}:
            for attempt_quality in range(quality - 5, 4, -5):
                output = io.BytesIO()
                image.save(output, format=target_format, quality=attempt_quality, optimize=True)
                if output.tell() <= target_size:
                    break


        output.seek(0)


        response = send_file(

            output,

            mimetype=f"image/{'jpeg' if target_format == 'JPEG' else target_format.lower()}",

            as_attachment=True,

            download_name=(

                f"compressed_"
                f"{uuid.uuid4().hex[:8]}.{'jpg' if target_format == 'JPEG' else target_format.lower()}"

            )

        )
        response.headers["X-Original-Size"] = str(len(original_bytes))
        response.headers["X-Compressed-Size"] = str(len(output.getvalue()))
        return response


    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    except Exception as e:

        print(
            "Image Compression Error:",
            e
        )

        return jsonify({

            "success": False,

            "message":
                "Compression error."

        }), 500


# ==========================================
# FILE TOO LARGE ERROR
# ==========================================

@app.errorhandler(413)

def file_too_large(error):

    return jsonify({

        "success": False,

        "message":
            "File is too large (Max 20MB)."

    }), 413



# =========# ==========================================
# ADVANCED PHOTO ART / SKETCH API
# ==========================================

@app.route("/api/sketch", methods=["POST"])
def create_sketch():

    try:

        # --------------------------------------
        # CHECK IMAGE
        # --------------------------------------

        if "image" not in request.files:
            return jsonify({
                "success": False,
                "message": "Please select an image."
            }), 400

        file = request.files["image"]

        if not file or file.filename == "":
            return jsonify({
                "success": False,
                "message": "No image selected."
            }), 400

        if not allowed_file(file.filename):
            return jsonify({
                "success": False,
                "message": "Invalid image format."
            }), 400


        # --------------------------------------
        # GET FILTER
        # --------------------------------------

        filter_type = request.form.get(
            "filter",
            "pencil"
        ).lower().strip()


        # --------------------------------------
        # OPEN IMAGE
        # --------------------------------------

        image = Image.open(
            io.BytesIO(file.read())
        )

        # Preserve original quality
        if image.mode != "RGB":
            image = image.convert("RGB")


        # ======================================
        # ✏️ REAL GRAPHITE PENCIL SKETCH
        # ======================================

        if filter_type == "pencil":

            # Convert to grayscale
            gray = ImageOps.grayscale(image)

            # Improve tonal range
            gray = ImageOps.autocontrast(gray)

            # Invert image
            inverted = ImageOps.invert(gray)

            # Blur inverted image
            blur = inverted.filter(
                ImageFilter.GaussianBlur(
                    radius=12
                )
            )

            # Manual dodge blend
            # No ImageChops.divide()
            width, height = gray.size

            gray_pixels = gray.load()
            blur_pixels = blur.load()

            result = Image.new(
                "L",
                (width, height)
            )

            result_pixels = result.load()

            for y in range(height):

                for x in range(width):

                    base = gray_pixels[x, y]
                    blend = blur_pixels[x, y]

                    if blend >= 250:

                        value = 255

                    else:

                        value = int(
                            (base * 255)
                            /
                            max(
                                1,
                                255 - blend
                            )
                        )

                    value = max(
                        0,
                        min(
                            255,
                            value
                        )
                    )

                    result_pixels[x, y] = value


            # Strong pencil contrast
            result = ImageOps.autocontrast(
                result,
                cutoff=1
            )


            # Slight darkening for graphite feel
            result = ImageEnhance.Contrast(
                result
            ).enhance(
                1.35
            )


            # Sharpen pencil strokes
            result = result.filter(
                ImageFilter.UnsharpMask(
                    radius=1.5,
                    percent=140,
                    threshold=3
                )
            )


            # Keep grayscale
            sketch = result


        # ======================================
        # 🖊️ REAL INK / PEN DRAWING
        # ======================================

        elif filter_type == "ink":

            gray = ImageOps.grayscale(
                image
            )

            # Detect edges
            edges = gray.filter(
                ImageFilter.FIND_EDGES
            )

            # Increase edge contrast
            edges = ImageOps.autocontrast(
                edges,
                cutoff=2
            )

            # Invert:
            # black lines on white paper
            edges = ImageOps.invert(
                edges
            )

            # Make lines stronger
            edges = ImageEnhance.Contrast(
                edges
            ).enhance(
                2.8
            )

            # Slight sharpening
            edges = edges.filter(
                ImageFilter.SHARPEN
            )

            sketch = edges


        # ======================================
        # 🎨 CLEAN CARTOON EFFECT
        # ======================================

        elif filter_type == "cartoon":

            # ----------------------------------
            # STEP 1: Smooth colors
            # ----------------------------------

            smooth = image.filter(
                ImageFilter.MedianFilter(
                    size=5
                )
            )

            smooth = smooth.filter(
                ImageFilter.SMOOTH_MORE
            )


            # ----------------------------------
            # STEP 2: Enhance colors
            # ----------------------------------

            smooth = ImageEnhance.Color(
                smooth
            ).enhance(
                1.35
            )

            smooth = ImageEnhance.Contrast(
                smooth
            ).enhance(
                1.12
            )


            # ----------------------------------
            # STEP 3: Create black outlines
            # ----------------------------------

            gray = ImageOps.grayscale(
                smooth
            )

            edges = gray.filter(
                ImageFilter.FIND_EDGES
            )

            edges = ImageOps.autocontrast(
                edges
            )


            # ----------------------------------
            # STEP 4: Threshold edges
            # ----------------------------------

            # Black lines = 0
            # White = 255
            edge_mask = edges.point(
                lambda p:
                0 if p < 75 else 255
            )


            # ----------------------------------
            # STEP 5: Slightly thicken lines
            # ----------------------------------

            edge_mask = edge_mask.filter(
                ImageFilter.MinFilter(
                    size=3
                )
            )


            # ----------------------------------
            # STEP 6: Create outline layer
            # ----------------------------------

            outline = Image.new(
                "RGB",
                smooth.size,
                (0, 0, 0)
            )


            # IMPORTANT:
            # edge_mask is L mode.
            # This fixes "bad transparency mask".
            cartoon = Image.composite(
                smooth,
                outline,
                edge_mask
            )


            # ----------------------------------
            # STEP 7: Final cartoon enhancement
            # ----------------------------------

            cartoon = ImageEnhance.Color(
                cartoon
            ).enhance(
                1.15
            )

            cartoon = ImageEnhance.Contrast(
                cartoon
            ).enhance(
                1.12
            )

            cartoon = ImageEnhance.Sharpness(
                cartoon
            ).enhance(
                1.5
            )


            sketch = cartoon


        # ======================================
        # 🖌️ OIL PAINT EFFECT
        # ======================================

        elif filter_type == "oil":

            oil = image.filter(
                ImageFilter.MedianFilter(
                    size=5
                )
            )

            oil = ImageEnhance.Color(
                oil
            ).enhance(
                1.45
            )

            oil = ImageEnhance.Contrast(
                oil
            ).enhance(
                1.2
            )

            oil = ImageEnhance.Sharpness(
                oil
            ).enhance(
                1.8
            )

            sketch = oil


        # ======================================
        # 🖤 BLACK & WHITE
        # ======================================

        elif filter_type == "bw":

            gray = ImageOps.grayscale(
                image
            )

            gray = ImageOps.autocontrast(
                gray
            )

            gray = ImageEnhance.Contrast(
                gray
            ).enhance(
                1.3
            )

            sketch = gray


        # ======================================
        # 🌈 COLOR ART
        # ======================================

        elif filter_type == "color":

            color = ImageEnhance.Color(
                image
            ).enhance(
                1.5
            )

            color = ImageEnhance.Contrast(
                color
            ).enhance(
                1.15
            )

            color = ImageEnhance.Sharpness(
                color
            ).enhance(
                1.7
            )

            sketch = color


        # ======================================
        # DEFAULT
        # ======================================

        else:

            sketch = image


        # ======================================
        # ENSURE VALID IMAGE MODE
        # ======================================

        if sketch.mode not in (
            "RGB",
            "L"
        ):

            sketch = sketch.convert(
                "RGB"
            )

        output = io.BytesIO()
        sketch.save(
            output,
            format="PNG",
            optimize=False
        )

        output.seek(0)


        # ======================================
        # RETURN IMAGE
        # ======================================

        return send_file(

            output,

            mimetype="image/png",

            as_attachment=True,

            download_name=(
                f"{filter_type}_"
                f"{uuid.uuid4().hex[:8]}"
                ".png"
            )

        )


    except Exception as e:

        print(
            "Sketch Processing Error:",
            repr(e)
        )

        return jsonify({

            "success": False,

            "message":
                f"Sketch processing error: {str(e)}"

        }), 500


# ==========================================
# YOUTUBE CREATOR TOOLS
# ==========================================

@app.route("/youtube")
def youtube_tools():
    """YouTube Creator Tools Dashboard"""
    return render_template("youtube/index.html")


@app.route("/youtube/tags-extractor")
def youtube_tags_extractor():
    """YouTube Tags Extractor Tool"""
    return render_template("youtube/tags_extractor.html")


@app.route("/youtube/thumbnail-downloader")
def youtube_thumbnail_downloader():
    """YouTube Thumbnail Downloader Tool"""
    return render_template("youtube/thumbnail_downloader.html")


@app.route("/youtube/description-extractor")
def youtube_description_extractor():
    """YouTube Description Extractor Tool"""
    return render_template("youtube/description_extractor.html")


@app.route("/youtube/video-titles")
def youtube_video_titles():
    """YouTube Video Titles Generator & Analyzer"""
    return render_template("youtube/video_titles.html")


@app.route("/youtube/comment-picker")
def youtube_comment_picker():
    """YouTube Comment Picker Tool"""
    return render_template("youtube/comment_picker.html")


@app.route("/youtube/trending-tags")
def youtube_trending_tags():
    """YouTube Trending Tags Tool"""
    return render_template("youtube/trending_tags.html")


@app.route("/youtube/to-mp3")
def youtube_to_mp3():
    """YouTube to MP3 Converter"""
    return render_template("youtube/youtube_to_mp3.html")


@app.route("/youtube/channel-analyzer")
def youtube_channel_analyzer():
    """YouTube Channel Analyzer Tool"""
    return render_template("youtube/channel_analyzer.html")


@app.route("/youtube/shorts-downloader")
def youtube_shorts_downloader():
    """YouTube Shorts Downloader Tool"""
    return render_template("youtube/shorts_downloader.html")


@app.route("/youtube/trending-videos")
def youtube_trending_videos():
    """YouTube Trending Videos Tool"""
    return render_template("youtube/trending_videos.html")


@app.route("/youtube/keyword-generator")
def youtube_keyword_generator():
    """YouTube Keyword Generator Tool"""
    return render_template("youtube/keyword_generator.html")


@app.route("/youtube/hashtag-generator")
def youtube_hashtag_generator():
    """YouTube Hashtag Generator Tool"""
    return render_template("youtube/hashtag_generator.html")


@app.route("/youtube/video-id-extractor")
def youtube_video_id_extractor():
    """YouTube Video ID Extractor Tool"""
    return render_template("youtube/video_id_extractor.html")


@app.route("/youtube/timestamp-generator")
def youtube_timestamp_generator():
    """YouTube Timestamp Generator Tool"""
    return render_template("youtube/timestamp_generator.html")


@app.route("/youtube/embed-generator")
def youtube_embed_generator():
    """YouTube Embed Generator Tool"""
    return render_template("youtube/embed_generator.html")


@app.route("/youtube/watch-time-calculator")
def youtube_watch_time_calculator():
    """YouTube Watch Time Calculator Tool"""
    return render_template("youtube/watch_time_calculator.html")


@app.route("/youtube/thumbnail-url-extractor")
def youtube_thumbnail_url_extractor():
    """YouTube Thumbnail URL Extractor Tool"""
    return render_template("youtube/thumbnail_url_extractor.html")


@app.route("/youtube/video-analyzer")
def youtube_video_analyzer():
    """YouTube Video Analyzer Tool"""
    return render_template("youtube/video_analyzer.html")


@app.route("/youtube/content-idea-generator")
def youtube_content_idea_generator():
    """YouTube Content Idea Generator Tool"""
    return render_template("youtube/content_idea_generator.html")


@app.route("/youtube/upload-planner")
def youtube_upload_planner():
    """YouTube Upload Planner Tool"""
    return render_template("youtube/upload_planner.html")


# ==========================================
# DOWNLOADER STUDIO
# ==========================================

def _download_host(raw_url):
    if not raw_url or not str(raw_url).strip():
        raise ValueError("Please provide a valid URL.")

    parsed = urlparse(str(raw_url).strip())
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError("Please provide a valid HTTP(S) URL.")

    host = parsed.hostname.lower()
    if host in {"localhost", "0.0.0.0"} or host.endswith(".local") or host.startswith("127."):
        raise ValueError("private network addresses are not allowed for downloads.")

    try:
        addr = ipaddress.ip_address(host)
    except ValueError:
        return host

    if (
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local
        or addr.is_multicast
        or addr.is_reserved
        or addr.is_unspecified
    ):
        raise ValueError("private network addresses are not allowed for downloads.")

    return host


def _require_public_media_permission(payload):
    data = payload or {}
    url = (data.get("url") or "").strip()
    if not data.get("authorized", False):
        raise PermissionError("permission is required before downloading public media.")
    if not url:
        raise ValueError("A public media URL is required.")

    host = _download_host(url)
    supported_hosts = {
        "youtube.com",
        "www.youtube.com",
        "youtu.be",
        "www.youtu.be",
        "instagram.com",
        "www.instagram.com",
        "facebook.com",
        "www.facebook.com",
        "pinterest.com",
        "www.pinterest.com",
        "snapchat.com",
        "www.snapchat.com",
        "sharechat.com",
        "www.sharechat.com",
        "soundcloud.com",
        "www.soundcloud.com",
        "spotify.com",
        "www.spotify.com",
        "x.com",
        "www.x.com",
        "twitter.com",
        "www.twitter.com",
    }
    if host not in supported_hosts and not any(host.endswith(f".{suffix}") for suffix in {"youtube.com", "youtu.be", "instagram.com", "facebook.com", "pinterest.com", "snapchat.com", "sharechat.com", "soundcloud.com", "spotify.com", "x.com", "twitter.com"}):
        raise ValueError("This downloader only supports authorized public media from supported platforms.")
    return host


@app.route("/downloader-studio")
def downloader_studio():
    return render_template("downloader_studio.html")


@app.route("/downloader-tools/<slug>")
def downloader_tool_detail(slug):
    tool_map = {
        "apk-downloader-inspector": {"title": "APK Downloader & Inspector", "panel": "apkPanel", "mode": "apk", "media_type": "file"},
        "ebook-downloader-converter": {"title": "Ebook Downloader & Converter", "panel": "epubPanel", "mode": "epub", "media_type": "file"},
        "image-downloader": {"title": "Image Downloader", "panel": "directPanel", "mode": "direct", "media_type": "file"},
        "facebook-public-media": {"title": "Facebook Public Media", "panel": "mediaPanel", "mode": "media", "media_type": "video"},
        "pinterest-media": {"title": "Pinterest Media", "panel": "mediaPanel", "mode": "media", "media_type": "video"},
        "spotify-track-playlist-exporter": {"title": "Spotify Track & Playlist Exporter", "panel": "metadataPanel", "mode": "metadata", "media_type": "music"},
        "jiosaavn-metadata-tool": {"title": "JioSaavn Metadata Tool", "panel": "metadataPanel", "mode": "metadata", "media_type": "music"},
        "apple-music-metadata-exporter": {"title": "Apple Music Metadata Exporter", "panel": "metadataPanel", "mode": "metadata", "media_type": "music"},
        "gaana-metadata-tool": {"title": "Gaana Metadata Tool", "panel": "metadataPanel", "mode": "metadata", "media_type": "music"},
        "hungama-metadata-tool": {"title": "Hungama Metadata Tool", "panel": "metadataPanel", "mode": "metadata", "media_type": "music"},
        "youtube-to-mp3": {"title": "YouTube to MP3", "panel": "mediaPanel", "mode": "media", "media_type": "audio", "audio_format": "mp3"},
        "instagram-public-media": {"title": "Instagram Public Media", "panel": "mediaPanel", "mode": "media", "media_type": "video"},
        "instagram-audio": {"title": "Instagram Audio", "panel": "mediaPanel", "mode": "media", "media_type": "audio", "audio_format": "mp3"},
        "instagram-image-carousel": {"title": "Instagram Image / Carousel", "panel": "directPanel", "mode": "direct", "media_type": "file"},
        "snapchat-public-media": {"title": "Snapchat Public Media", "panel": "mediaPanel", "mode": "media", "media_type": "video"},
        "youtube-shorts-downloader": {"title": "YouTube Shorts Downloader", "panel": "mediaPanel", "mode": "media", "media_type": "video"},
        "sharechat-public-video": {"title": "ShareChat Public Video", "panel": "mediaPanel", "mode": "media", "media_type": "video"},
        "audio-url-downloader": {"title": "Audio URL Downloader", "panel": "directPanel", "mode": "direct", "media_type": "audio"},
        "soundcloud-track-metadata": {"title": "SoundCloud Track & Metadata", "panel": "metadataPanel", "mode": "metadata", "media_type": "music"},
    }
    tool = tool_map.get(slug)
    if not tool:
        return redirect(url_for("downloader_studio"))
    return render_template("downloader_studio.html", download_tool=tool)


@app.route("/api/downloader/direct", methods=["POST"])
def api_downloader_direct():
    data = request.get_json(silent=True) or request.form or {}
    url = (data.get("url") or "").strip()
    try:
        _download_host(url)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    try:
        response = requests.get(url, timeout=(10, 30), stream=True, headers={"User-Agent": "Mozilla/5.0"})
        response.raise_for_status()
        filename = os.path.basename(urlparse(url).path) or "download"
        content = response.content
        if not content:
            raise ValueError("The remote file was empty.")
        return send_file(io.BytesIO(content), mimetype=response.headers.get("Content-Type", "application/octet-stream"), as_attachment=True, download_name=filename)
    except Exception as exc:
        return jsonify({"success": False, "message": f"Download failed: {exc}"}), 400


@app.route("/api/downloader/public-media", methods=["POST"])
def api_downloader_public_media():
    try:
        _require_public_media_permission(request.get_json(silent=True) or request.form or {})
    except PermissionError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400

    return jsonify({"success": False, "message": "This public media route only supports authorized sources and supported platforms."}), 400


@app.route("/api/downloader/apk-inspect", methods=["POST"])
def api_downloader_apk_inspect():
    file = request.files.get("file") or request.files.get("apk")
    if not file or file.filename == "":
        return jsonify({"success": False, "message": "Please upload an APK or AAB file."}), 400

    payload = file.read()
    digest = hashlib.sha256(payload).hexdigest()
    package = "Unknown"
    version_name = "Unknown"
    version_code = "Unknown"
    signed_files = []
    manifest_readable = False

    try:
        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            names = archive.namelist()
            signed_files = sorted(
                name for name in names if name.upper().startswith("META-INF/")
            )
            manifest_name = next((name for name in names if name.lower().endswith("androidmanifest.xml")), None)
            if manifest_name:
                manifest = archive.read(manifest_name)
                manifest_readable = True
                match = re.search(rb'package="([^"]+)"', manifest)
                if match:
                    package = match.group(1).decode("utf-8", "ignore")
                version_match = re.search(rb'android:versionName="([^"]+)"', manifest)
                if version_match:
                    version_name = version_match.group(1).decode("utf-8", "ignore")
                code_match = re.search(rb'android:versionCode="([^"]+)"', manifest)
                if code_match:
                    version_code = code_match.group(1).decode("utf-8", "ignore")
    except Exception:
        manifest_readable = False

    return jsonify({
        "success": True,
        "data": {
            "filename": file.filename,
            "kind": "APK" if file.filename.lower().endswith(".apk") else "AAB",
            "size": len(payload),
            "package": package,
            "version_name": version_name,
            "version_code": version_code,
            "sha256": digest,
            "signed_files": signed_files[:20],
            "manifest_readable": manifest_readable,
        },
    })


@app.route("/api/downloader/epub", methods=["POST"])
def api_downloader_epub():
    file = request.files.get("file")
    if not file or file.filename == "":
        return jsonify({"success": False, "message": "Please upload an EPUB file."}), 400

    action = (request.form.get("action") or "inspect").lower()
    epub_bytes = file.read()

    try:
        with zipfile.ZipFile(io.BytesIO(epub_bytes)) as archive:
            names = set(archive.namelist())
            container_name = next((name for name in names if name.endswith("META-INF/container.xml")), None)
            if not container_name:
                raise ValueError("Invalid EPUB container.")
            container = archive.read(container_name).decode("utf-8", "ignore")
            root_match = re.search(r'<rootfile[^>]+full-path="([^"]+)"', container)
            if not root_match:
                raise ValueError("EPUB root file not found.")
            root_path = root_match.group(1)
            opf = archive.read(root_path).decode("utf-8", "ignore")

            title_match = re.search(r'<dc:title[^>]*>(.*?)</dc:title>', opf, re.IGNORECASE | re.DOTALL)
            creator_match = re.search(r'<dc:creator[^>]*>(.*?)</dc:creator>', opf, re.IGNORECASE | re.DOTALL)
            language_match = re.search(r'<dc:language[^>]*>(.*?)</dc:language>', opf, re.IGNORECASE | re.DOTALL)
            title = re.sub(r'<.*?>', '', title_match.group(1)) if title_match else "Untitled Book"
            creator = re.sub(r'<.*?>', '', creator_match.group(1)) if creator_match else "Unknown Author"
            language = language_match.group(1).strip() if language_match else "en"
            chapters = len(re.findall(r'<item[^>]+href="([^"]+)"', opf, re.IGNORECASE))

            if action == "text":
                chapters_file = next((name for name in names if name.lower().endswith(".xhtml") or name.lower().endswith(".html")), None)
                chapter_content = archive.read(chapters_file).decode("utf-8", "ignore") if chapters_file else ""
                plain_text = re.sub(r'<[^>]+>', '\n', chapter_content)
                text = "\n".join(line.strip() for line in plain_text.splitlines() if line.strip())
                output = io.BytesIO(text.encode("utf-8"))
                return send_file(output, mimetype="text/plain", as_attachment=True, download_name="ebook.txt")

            return jsonify({
                "success": True,
                "data": {
                    "title": title,
                    "creator": creator,
                    "language": language,
                    "chapters": chapters,
                    "filename": file.filename,
                },
            })
    except Exception as exc:
        return jsonify({"success": False, "message": f"EPUB processing failed: {exc}"}), 400


# ==========================================
# RUN FLASK APP
# ==========================================

if __name__ == "__main__":

    app.run(

        debug=False,

        use_reloader=False,

        host="127.0.0.1",

        port=5000

    )
    