# Deploy Thakronix on Render

1. Push this project directory to a GitHub repository.
2. In Render, choose **New > Blueprint**, connect the repository, and apply the `render.yaml` blueprint.
3. Wait for the first build and open the generated `onrender.com` URL. Render deploys the app with Gunicorn and installs the OCR and media-processing system packages from `apt.txt`.

The blueprint uses Render's Free plan. Its filesystem is temporary, so emergency QR shares, secure-share rooms, and locally written request/profile logs can be lost when Render restarts or redeploys the service. Move to a paid instance with a persistent disk before relying on those records long term. Do not store encryption keys or other secrets in the repository.
