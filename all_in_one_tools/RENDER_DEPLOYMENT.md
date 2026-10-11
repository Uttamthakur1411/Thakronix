# Deploy Thakronix on Render

1. Push the repository to GitHub. The Render Blueprint and deployment-level `requirements.txt`/`apt.txt` are at the repository root; the Flask app is in `all_in_one_tools`.
2. In Render, choose **New > Blueprint**, connect the repository, and apply the root-level `render.yaml` blueprint. Do not set a service Root Directory: leave it blank so Render can read the root dependency files.
3. If configuring a Web Service manually, leave **Root Directory** blank and set:
   - Build command: `pip install -r requirements.txt`
   - Start command: `if [ ! -f app.py ] && [ -f all_in_one_tools/app.py ]; then cd all_in_one_tools; fi; exec gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 120 app:app`
4. Wait for the first build and open the generated `onrender.com` URL. Render installs OCR and media-processing system packages from the root `apt.txt`.

The blueprint uses Render's Free plan. Its filesystem is temporary, so emergency QR shares, secure-share rooms, and locally written request/profile logs can be lost when Render restarts or redeploys the service. Move to a paid instance with a persistent disk before relying on those records long term. Do not store encryption keys or other secrets in the repository.
