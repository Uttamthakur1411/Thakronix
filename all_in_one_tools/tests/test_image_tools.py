import unittest
import json
import os
import tempfile
import zipfile
from io import BytesIO
from PIL import Image
from reportlab.pdfgen import canvas

import app


def make_pdf(text):
    buffer = BytesIO()
    c = canvas.Canvas(buffer)
    c.setTitle("demo")
    c.drawString(100, 750, text)
    c.save()
    buffer.seek(0)
    return buffer.getvalue()


class TestImageToolHelpers(unittest.TestCase):
    def test_image_to_base64_and_back(self):
        img = Image.new("RGB", (20, 20), color=(12, 34, 56))
        encoded = app.image_to_base64(img)
        self.assertIn("data:image/png;base64,", encoded)

        restored = app.base64_to_image(encoded)
        self.assertEqual(restored.size, (20, 20))
        self.assertEqual(restored.getpixel((0, 0)), (12, 34, 56))

    def test_background_removal_keeps_transparency(self):
        img = Image.new("RGBA", (10, 10), (255, 255, 255, 255))
        cleaned = app.remove_background(img, color_threshold=245)
        self.assertEqual(cleaned.mode, "RGBA")
        self.assertEqual(cleaned.getpixel((0, 0))[3], 0)

    def test_merge_and_split_pdf_helpers(self):
        first = make_pdf("first page")
        second = make_pdf("second page")

        merged = app.merge_pdf_bytes([first, second])
        self.assertTrue(merged.startswith(b"%PDF"))

        split = app.split_pdf_pages(first, 1, 1)
        self.assertTrue(split.startswith(b"%PDF"))

    def test_pdf_to_jpg_bytes(self):
        pdf_bytes = make_pdf("hello pdf")
        jpg_bytes = app.pdf_to_jpg_bytes(pdf_bytes, page_index=0)
        self.assertTrue(jpg_bytes.startswith(b"\xff\xd8"))

    def test_utility_studio_dashboard_route(self):
        client = app.app.test_client()
        response = client.get("/utility-studio")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Utility Studio", response.data)
        self.assertEqual(response.data.count(b"data-utility-tool"), 22)

    def test_home_brand_responsive_assets_and_case_study_route(self):
        client = app.app.test_client()
        home = client.get("/")
        self.assertEqual(home.status_code, 200)
        self.assertIn(b"Thakronix", home.data)
        self.assertNotIn(b"Tool" + b"Forge", home.data)
        self.assertIn(b"/static/css/site_responsive.css", home.data)
        self.assertIn(b'name="viewport"', home.data)

        developer = client.get("/developer")
        self.assertEqual(developer.status_code, 200)
        self.assertIn(b"Uttam Thakur", developer.data)

        case_study = client.get("/developer/projects/thakronix")
        self.assertEqual(case_study.status_code, 200)
        self.assertIn(b"Thakronix", case_study.data)

    def test_global_assets_add_viewport_to_older_pages(self):
        with app.app.test_request_context("/"):
            response = app.make_response("<html><head></head><body></body></html>")
            response = app.add_tool_feedback_assets(response)

        self.assertIn(b'name="viewport"', response.data)
        self.assertIn(b"/static/css/site_responsive.css", response.data)


class TestDownloaderStudio(unittest.TestCase):
    def setUp(self):
        self.client = app.app.test_client()

    def test_tool_request_submission_and_validation(self):
        original_instance_path = app.app.instance_path
        with self.subTest("invalid request is rejected"):
            response = self.client.post("/api/tool-requests", json={"request": "   "})
            self.assertEqual(response.status_code, 400)

        with self.subTest("valid request is saved and acknowledged"):
            with tempfile.TemporaryDirectory() as temp_dir:
                app.app.instance_path = temp_dir
                try:
                    response = self.client.post("/api/tool-requests", json={
                        "request": "A useful new tool",
                        "replyEmail": "person@example.com",
                    })
                    self.assertEqual(response.status_code, 201)
                    with open(os.path.join(temp_dir, "tool_requests.jsonl"), encoding="utf-8") as requests_file:
                        saved_request = json.loads(requests_file.readline())
                    self.assertEqual(saved_request["request"], "A useful new tool")
                    self.assertEqual(saved_request["replyEmail"], "person@example.com")
                    self.assertIn("submittedAt", saved_request)
                finally:
                    app.app.instance_path = original_instance_path

    def test_studio_route_and_popular_tool_card(self):
        response = self.client.get("/downloader-studio")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.count(b'class="catalog-tool"'), 22)
        home = self.client.get("/")
        self.assertIn(b"Downloader Studio", home.data)

    def test_direct_download_rejects_private_host(self):
        response = self.client.post("/api/downloader/direct", json={"url": "http://127.0.0.1/private"})
        self.assertEqual(response.status_code, 400)
        self.assertIn(b"private network", response.data)

    def test_media_download_requires_permission(self):
        response = self.client.post("/api/downloader/public-media", json={
            "url": "https://youtube.com/watch?v=abcdefghijk",
            "type": "video",
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn(b"permission", response.data)

    def test_youtube_download_checks_host_and_permission(self):
        response = self.client.post("/api/youtube-download", json={
            "url": "https://youtube.com/watch?v=abcdefghijk",
            "type": "video",
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn(b"permission", response.data)
        response = self.client.post("/api/youtube-download", json={
            "url": "https://example.com/watch?v=abcdefghijk",
            "type": "video",
            "authorized": True,
        })
        self.assertEqual(response.status_code, 400)

    def test_apk_inspection_returns_checksum_and_manifest(self):
        apk = BytesIO()
        with zipfile.ZipFile(apk, "w") as archive:
            archive.writestr("AndroidManifest.xml", '<manifest package="org.example.demo" android:versionName="1.2" android:versionCode="12"/>')
            archive.writestr("META-INF/CERT.RSA", b"signature")
        apk.seek(0)
        response = self.client.post("/api/downloader/apk-inspect", data={
            "file": (apk, "demo.apk"),
        }, content_type="multipart/form-data")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["package"], "org.example.demo")
        self.assertEqual(data["version_name"], "1.2")
        self.assertTrue(data["sha256"])
        self.assertEqual(data["signed_files"], ["META-INF/CERT.RSA"])

    def test_epub_metadata_and_text_export(self):
        epub = BytesIO()
        with zipfile.ZipFile(epub, "w") as archive:
            archive.writestr("META-INF/container.xml", '<container><rootfiles><rootfile full-path="OEBPS/content.opf"/></rootfiles></container>')
            archive.writestr("OEBPS/content.opf", '<package xmlns:dc="urn:dc"><metadata><dc:title>Sample Book</dc:title><dc:creator>Example Author</dc:creator><dc:language>en</dc:language></metadata><manifest><item id="chapter" href="chapter.xhtml"/></manifest><spine><itemref idref="chapter"/></spine></package>')
            archive.writestr("OEBPS/chapter.xhtml", "<html><body><p>Hello from the book.</p></body></html>")
        epub_bytes = epub.getvalue()
        response = self.client.post("/api/downloader/epub", data={
            "file": (BytesIO(epub_bytes), "sample.epub"),
            "action": "inspect",
        }, content_type="multipart/form-data")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["data"]["title"], "Sample Book")
        self.assertEqual(response.get_json()["data"]["chapters"], 1)

        response = self.client.post("/api/downloader/epub", data={
            "file": (BytesIO(epub_bytes), "sample.epub"),
            "action": "text",
        }, content_type="multipart/form-data")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Hello from the book.", response.data)


if __name__ == "__main__":
    unittest.main()
