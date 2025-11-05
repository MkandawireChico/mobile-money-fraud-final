# Deployment Guide — Mobile Money Fraud Detection

This document describes how to build and host the backend and frontend using Docker images built by GitHub Actions and deployed to a hosting provider (Render, Cloud Run, or DigitalOcean App Platform).

## What we added
- A GitHub Actions workflow `.github/workflows/build-and-publish-images.yml` that builds Docker images for the backend (`server`) and frontend (`client`) and pushes them to GitHub Container Registry (GHCR) as:
  - ghcr.io/<your-org>/mobile-money-fraud-backend:latest
  - ghcr.io/<your-org>/mobile-money-fraud-frontend:latest

## Pre-requisites
- GitHub repository with Actions enabled.
- GHCR access (the workflow uses the repo's `GITHUB_TOKEN` to push packages — ensure `packages: write` is allowed).
- Create and configure runtime environment variables/secrets in your hosting provider (see `server/.env.example` for variables required).

## Deploy to Render (recommended for simplicity)
1. Create a new Web Service on Render for the backend.
   - Choose "Docker" as the environment.
   - For the Docker image, use `ghcr.io/<your-org>/mobile-money-fraud-backend:latest` (replace `<your-org>` with your GH org or username).
   - Set environment variables on Render matching your `server/.env.example` (DB, REDIS, JWT_SECRET, etc.).
   - Set the health check to `GET /api/ping`.
   - Expose port 5000 (or use the default)

2. Create a new Web Service for the frontend.
   - Use the image `ghcr.io/<your-org>/mobile-money-fraud-frontend:latest`.
   - Serve over HTTPS (Render will provision TLS for you).
   - Set environment variable `REACT_APP_API_URL` pointing to your backend URL.

3. Deploy & Monitor
   - After pushing to `main`, the workflow will build and publish images. On Render, trigger a pull of the new image or connect Render to the GitHub registry to auto-deploy.

## Deploy to Google Cloud Run
1. Push the images to Google Container Registry or use GHCR with Cloud Run.
2. Create a Cloud Run service for the backend using the backend image.
   - Set environment variables from `.env.example`.
   - Allow unauthenticated invocations if you want public access, or configure IAP otherwise.
3. Create a Cloud Run service for the frontend.

## DIY on a VM (Ubuntu)
1. Provision an Ubuntu VM with Docker and Docker Compose installed.
2. Copy the repo and `server/.env.example` to the server, rename `.env.example` to `.env` and set real secrets.
3. Run:

```bash
sudo apt update && sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER
# log out and in or run newgrp docker
cd /path/to/repo
docker compose up --build -d
```

4. Set up a reverse proxy (nginx) with TLS (Let's Encrypt) or use a cloud load balancer.

## Notes & Next Steps
- Healthchecks: `/api/ping` (backend) and `/metrics` (Prometheus) are available.
- Observability: We added `pino` structured logging and a `/metrics` endpoint for Prometheus via `prom-client`.
- Security: Rotate `JWT_SECRET` and `ENCRYPTION_KEY`, configure DB credentials securely.

If you'd like, I can:
- Create a Render-specific `render.yaml` and instructions for connecting GHCR.
- Create a GitHub Actions workflow that also triggers Render deploys automatically (added: `.github/workflows/trigger-render-deploy.yml`).
- Add cloud-specific examples (Cloud Run, ECS) and a demo Terraform module.

Next step I implemented for you:

- A workflow `.github/workflows/trigger-render-deploy.yml` that triggers deploys on Render for two services (backend and frontend) when you push to `main`. To use it, add the following repo secrets in GitHub Settings → Secrets & variables → Actions:
   - `RENDER_API_KEY` — your Render API key (create in Render dashboard)
   - `RENDER_SERVICE_ID_BACKEND` — the service ID for your backend on Render
   - `RENDER_SERVICE_ID_FRONTEND` — the service ID for your frontend on Render

After setting those secrets, pushes to `main` will trigger Render to pull the latest images or rebuild depending on how you configured the services.

Which hosting path should I finalize for you now?
- "Render (auto-deploy)" — I will add a `render.yaml` and a small Action that can also wait for deploy completion and report status.
- "Cloud Run" — I will add a `cloudbuild.yaml` and a small Terraform example to deploy the images.
- "VM bootstrap" — I will add `deploy/bootstrap.sh` that installs Docker and runs `docker compose up -d` and a systemd unit.

Say which one and I'll implement it.
