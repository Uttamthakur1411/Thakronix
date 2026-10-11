import io
import os
import re
import uuid
from flask import Flask, jsonify, render_template, request, send_file
from flask_cors import CORS
from PIL import Image
import requests
import yt_dlp

app = Flask(__name__)
CORS(app)

# Maximum upload size: 20 MB
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "bmp", "gif"}


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


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


def extract_all_hashtags(info, description):
    """ Extract hashtags from tags & description without duplicates """
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

    return list(tags_set) if tags_set else ["#youtube", "#trending", "#viral"]


# ============================
# MAIN NAVIGATION ROUTES
# ============================

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/tools")
def tools():
    return render_template("tools.html")

@app.route("/image-converter")
def image_converter():
    return render_template("image_converter.html")

@app.route("/image-compressor")
def image_compressor():
    return render_template("image_compressor.html")

@app.route("/sketch")
def sketch():
    return render_template("sketch.html")

@app.route("/qr-generator")
def qr_generator():
    return render_template("qr_generator.html")

@app.route("/pdf-tools")
def pdf_tools():
    return render_template("pdf_tools.html")

@app.route("/youtube-downloader")
def youtube_downloader():
    return render_template("youtube_downloader.html")


# ==========================================
# YOUTUBE INFO API
# ==========================================
@app.route("/api/youtube-info", methods=["GET", "POST"])
def youtube_info():
    try:
        if request.method == "POST":
            data = request.get_json(silent=True) or request.form or {}
            url = data.get("url", "").strip()
        else:
            url = request.args.get("url", "").strip()

        if not url:
            return jsonify({"success": False, "message": "Please enter a YouTube URL."}), 400

        video_id = extract_video_id(url)
        if not video_id:
            return jsonify({"success": False, "message": "Invalid YouTube URL format."}), 400

        title = f"YouTube Video ({video_id})"
        channel = "YouTube Channel"
        duration = "N/A"
        views = 0
        description = ""
        hashtags = []
        thumbnail = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"

        try:
            ydl_opts = {
                "quiet": True,
                "no_warnings": True,
                "skip_download": True,
                "socket_timeout": 8,
                "nocheckcertificate": True,
                "http_headers": {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                },
                "extractor_args": {
                    "youtube": {
                        "player_client": ["android", "web"]
                    }
                }
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if info:
                    title = info.get("title") or title
                    channel = info.get("uploader") or info.get("channel") or channel
                    duration = format_duration(info.get("duration"))
                    views = info.get("view_count") or 0
                    description = info.get("description") or ""
                    hashtags = extract_all_hashtags(info, description)
                    thumbnail = info.get("thumbnail") or thumbnail

        except Exception as e_ytdlp:
            print("yt-dlp Warning, fallback to oEmbed:", e_ytdlp)
            try:
                headers = {'User-Agent': 'Mozilla/5.0'}
                res = requests.get(
                    f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json",
                    headers=headers,
                    timeout=5
                )
                if res.status_code == 200:
                    o_data = res.json()
                    title = o_data.get("title", title)
                    channel = o_data.get("author_name", channel)
                    thumbnail = o_data.get("thumbnail_url", thumbnail)
            except Exception as e_oembed:
                print("oEmbed Error:", e_oembed)

        metadata = {
            "title": title,
            "channel": channel,
            "duration": duration,
            "views": views,
            "description": description if description else "No description available.",
            "hashtags": hashtags if hashtags else ["#youtube", "#video"],
            "thumbnail": thumbnail,
            "embed_url": f"https://www.youtube.com/embed/{video_id}",
            "source_url": url
        }

        return jsonify({"success": True, "data": metadata})

    except Exception as e:
        print("Backend Error:", str(e))
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


# ==========================================
# FAIL-PROOF THUMBNAIL DOWNLOAD ROUTE
# ==========================================
@app.route("/api/download-thumbnail", methods=["GET", "POST"])
@app.route("/api/youtube-thumbnail", methods=["GET", "POST"])
@app.route("/api/youtube-download", methods=["GET", "POST"])  # Alias to prevent 404 errors!
def download_thumbnail():
    try:
        url = ""
        if request.method == "POST":
            data = request.get_json(silent=True) or request.form or {}
            url = data.get("url", "").strip() or data.get("thumbnail_url", "").strip()
        else:
            url = request.args.get("url", "").strip() or request.args.get("thumbnail_url", "").strip()

        if not url:
            return jsonify({"success": False, "message": "YouTube URL missing."}), 400

        video_id = extract_video_id(url)
        if not video_id:
            return jsonify({"success": False, "message": "Invalid YouTube URL."}), 400

        # Try highest quality to lowest quality
        quality_urls = [
            f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
            f"https://img.youtube.com/vi/{video_id}/sddefault.jpg",
            f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
            f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg",
            f"https://img.youtube.com/vi/{video_id}/default.jpg"
        ]

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        }

        img_data = None
        for img_url in quality_urls:
            try:
                res = requests.get(img_url, headers=headers, timeout=5)
                # YouTube returns empty pixel placeholder (<3000 bytes) if image is unavailable
                if res.status_code == 200 and len(res.content) > 3000:
                    img_data = res.content
                    break
            except Exception:
                continue

        if not img_data:
            res = requests.get(quality_urls[2], headers=headers, timeout=5)
            img_data = res.content

        buffer = io.BytesIO(img_data)
        buffer.seek(0)

        return send_file(
            buffer,
            mimetype="image/jpeg",
            as_attachment=True,
            download_name=f"thumbnail_{video_id}.jpg"
        )

    except Exception as e:
        return jsonify({"success": False, "message": f"Thumbnail Download Error: {str(e)}"}), 500


# ==========================================
# EXPORT HASHTAGS & DESCRIPTION (.TXT FILE)
# ==========================================
@app.route("/api/youtube-export", methods=["GET", "POST"])
def youtube_export():
    try:
        url = request.args.get("url", "").strip() or request.form.get("url", "").strip()
        if not url and request.is_json:
            data = request.get_json(silent=True) or {}
            url = data.get("url", "").strip()

        if not url:
            return jsonify({"success": False, "message": "YouTube URL missing."}), 400

        video_id = extract_video_id(url)
        
        title, channel, description, hashtags = "YouTube Video", "N/A", "", []
        try:
            ydl_opts = {
                "quiet": True,
                "skip_download": True,
                "socket_timeout": 6,
                "nocheckcertificate": True,
                "extractor_args": {"youtube": {"player_client": ["android", "web"]}}
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if info:
                    title = info.get("title") or title
                    channel = info.get("uploader") or channel
                    description = info.get("description") or ""
                    hashtags = extract_all_hashtags(info, description)
        except Exception as e:
            print("Export fetch error:", e)

        tags_str = " ".join(hashtags) if isinstance(hashtags, list) else str(hashtags)

        content = (
            f"========================================\n"
            f"YOUTUBE METADATA & HASHTAGS EXPORT\n"
            f"========================================\n\n"
            f"TITLE      : {title}\n"
            f"CHANNEL    : {channel}\n"
            f"URL        : {url}\n"
            f"VIDEO ID   : {video_id if video_id else 'N/A'}\n"
            f"HASHTAGS   : {tags_str}\n\n"
            f"----------------------------------------\n"
            f"FULL DESCRIPTION:\n"
            f"----------------------------------------\n"
            f"{description if description else 'No description available.'}\n\n"
            f"========================================\n"
        )

        buffer = io.BytesIO(content.encode("utf-8"))
        buffer.seek(0)
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"youtube-info-{video_id if video_id else 'export'}.txt",
            mimetype="text/plain"
        )
    except Exception as e:
        return jsonify({"success": False, "message": f"Export Error: {str(e)}"}), 500


# ============================
# CONVERTER & COMPRESSOR TOOLS
# ============================

@app.route("/convert-image", methods=["POST"])
def convert_image():
    try:
        if "image" not in request.files:
            return jsonify({"success": False, "message": "No image selected."}), 400

        file = request.files["image"]
        if file.filename == "" or not allowed_file(file.filename):
            return jsonify({"success": False, "message": "Invalid image file."}), 400

        target_format = request.form.get("format", "PNG").upper()
        image = Image.open(io.BytesIO(file.read()))

        output = io.BytesIO()
        if target_format == "JPEG":
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")
            image.save(output, format="JPEG", quality=90, optimize=True)
            extension = "jpg"
        elif target_format == "WEBP":
            image.save(output, format="WEBP", quality=90)
            extension = "webp"
        else:
            image.save(output, format="PNG", optimize=True)
            extension = "png"

        output.seek(0)
        return send_file(
            output,
            mimetype=f"image/{extension}",
            as_attachment=True,
            download_name=f"converted_{uuid.uuid4().hex[:8]}.{extension}"
        )
    except Exception as e:
        return jsonify({"success": False, "message": "Conversion error."}), 500


@app.route("/compress-image", methods=["POST"])
def compress_image():
    try:
        if "image" not in request.files:
            return jsonify({"success": False, "message": "No image selected."}), 400

        file = request.files["image"]
        image = Image.open(io.BytesIO(file.read()))
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        output = io.BytesIO()
        image.save(output, format="JPEG", quality=60, optimize=True)
        output.seek(0)

        return send_file(
            output,
            mimetype="image/jpeg",
            as_attachment=True,
            download_name=f"compressed_{uuid.uuid4().hex[:8]}.jpg"
        )
    except Exception as e:
        return jsonify({"success": False, "message": "Compression error."}), 500


@app.errorhandler(413)
def file_too_large(error):
    return jsonify({"success": False, "message": "File is too large (Max 20MB)."}), 413


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)