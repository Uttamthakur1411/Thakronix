# Deploy Thakronix on Render

1. Push the repository to GitHub. The app files are in the `all_in_one_tools` subdirectory.
2. In Render, choose **New > Blueprint**, connect the repository, and apply the root-level `render.yaml` blueprint. It sets the service root directory to `all_in_one_tools`, so Render can find `requirements.txt`, `apt.txt`, and `app.py`.
3. If configuring a Web Service manually instead, set **Root Directory** to `all_in_one_tools` and use `pip install -r requirements.txt` as the build command.
4. Wait for the first build and open the generated `onrender.com` URL. Render deploys the app with Gunicorn and installs the OCR and media-processing system packages from `apt.txt`.

The blueprint uses Render's Free plan. Its filesystem is temporary, so emergency QR shares, secure-share rooms, and locally written request/profile logs can be lost when Render restarts or redeploys the service. Move to a paid instance with a persistent disk before relying on those records long term. Do not store encryption keys or other secrets in the repository.
