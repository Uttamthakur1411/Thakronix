import json
import os
import sqlite3
import tempfile
import unittest
from urllib.parse import urlparse

import app


class TestEmergencyQr(unittest.TestCase):
    def setUp(self):
        self.original_instance_path = app.app.instance_path
        self.temp_dir = tempfile.TemporaryDirectory()
        app.app.instance_path = self.temp_dir.name
        self.client = app.app.test_client()

    def tearDown(self):
        app.app.instance_path = self.original_instance_path
        self.temp_dir.cleanup()

    def create_share(self, data=None):
        return self.client.post("/api/emergency-qr", json={
            "data": data or {"name": "Alex Example", "blood_group": "O+"},
            "ttl": 3600,
        })

    def test_selected_fields_are_encrypted_and_read_only(self):
        created = self.create_share()
        self.assertEqual(created.status_code, 201)
        share = created.get_json()
        self.assertTrue(share["qrDataUrl"].startswith("data:image/png;base64,"))
        token = urlparse(share["url"]).path.rsplit("/", 1)[-1]

        connection = sqlite3.connect(os.path.join(self.temp_dir.name, "emergency_qr.sqlite3"))
        ciphertext = connection.execute("SELECT ciphertext FROM emergency_qr_shares WHERE token = ?", (token,)).fetchone()[0]
        connection.close()
        self.assertNotIn(b"Alex Example", ciphertext)

        page = self.client.get(f"/emergency-qr/{token}")
        self.assertEqual(page.status_code, 200)
        self.assertIn(b"Alex Example", page.data)
        self.assertIn(b"O+", page.data)
        self.assertNotIn(b"Allergies", page.data)
        self.assertEqual(page.headers["Cache-Control"], "no-store, max-age=0")

    def test_revoke_key_is_required_and_revocation_is_immediate(self):
        share = self.create_share().get_json()
        token = urlparse(share["url"]).path.rsplit("/", 1)[-1]

        wrong_key = self.client.post(f"/api/emergency-qr/{token}/revoke", json={"revokeKey": "wrong"})
        self.assertEqual(wrong_key.status_code, 404)
        self.assertEqual(self.client.get(f"/emergency-qr/{token}").status_code, 200)

        revoked = self.client.post(f"/api/emergency-qr/{token}/revoke", json={"revokeKey": share["revokeKey"]})
        self.assertEqual(revoked.status_code, 200)
        self.assertEqual(self.client.get(f"/emergency-qr/{token}").status_code, 410)

    def test_expired_and_invalid_shares_are_rejected(self):
        invalid = self.client.post("/api/emergency-qr", json={"data": {"secret": "hidden"}, "ttl": 3600})
        self.assertEqual(invalid.status_code, 400)

        share = self.create_share().get_json()
        token = urlparse(share["url"]).path.rsplit("/", 1)[-1]
        connection = app._emergency_qr_db()
        connection.execute("UPDATE emergency_qr_shares SET expires_at = '2000-01-01T00:00:00+00:00' WHERE token = ?", (token,))
        connection.commit()
        connection.close()
        self.assertEqual(self.client.get(f"/emergency-qr/{token}").status_code, 410)

    def test_secure_share_room_view_renders_and_owner_flow_works(self):
        payload = json.dumps({
            "purpose": "Insurance claim review",
            "recipient": "Service Center",
            "watermarkText": "Service Center · View only",
            "documents": [{"name": "claim.pdf", "type": "application/pdf", "size": 128},{"name": "photo.jpg", "type": "image/jpeg", "size": 256}],
            "allowDownload": False,
        })
        created = self.client.post("/api/security/rooms", json={
            "payload": payload,
            "ttl": 86400,
            "allowDownload": False,
            "watermark": True,
            "purpose": "Insurance claim review",
            "recipient": "Service Center",
            "watermarkText": "Service Center · View only",
        })
        self.assertEqual(created.status_code, 201)
        room = created.get_json()
        token = room["token"]

        page = self.client.get(f"/security-room/{token}")
        self.assertEqual(page.status_code, 200)
        self.assertIn(b"Secure share room", page.data)

        log = self.client.post(f"/api/security/rooms/{token}/log", json={"ownerKey": room["ownerKey"]})
        self.assertEqual(log.status_code, 200)
        self.assertIn("entries", log.get_json())

        revoked = self.client.post(f"/api/security/rooms/{token}/revoke", json={"ownerKey": room["ownerKey"]})
        self.assertEqual(revoked.status_code, 200)
        self.assertEqual(self.client.get(f"/api/security/rooms/{token}").status_code, 410)


if __name__ == "__main__":
    unittest.main()