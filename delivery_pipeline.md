# CI/CD and Delivery Pipeline

## Overview

The project uses GitHub Actions to validate and package the React frontend and FastAPI backend.

Workflow files:

- `.github/workflows/ci.yml`
- `.github/workflows/delivery.yml`

## Continuous Integration

The CI workflow runs on pushes, pull requests, and manual execution.

Frontend validation:

- Checks out the repository.
- Sets up Node.js.
- Installs frontend dependencies with `npm ci`.
- Builds the React application with `npm run build`.

Backend validation:

- Checks out the repository.
- Sets up Python.
- Installs backend dependencies from `backend/requirements.txt`.
- Compiles the Python source code.
- Validates that the FastAPI application can be imported.
- Runs backend tests when a `backend/tests` directory exists.

## Delivery Pipeline

The delivery workflow runs after the CI workflow succeeds on `main` or `master`. It can also be run manually.

Frontend delivery:

- Installs frontend dependencies.
- Builds the React application.
- Uploads the `frontend/dist` folder as a GitHub Actions artifact named `frontend-dist`.

Backend delivery:

- Installs backend dependencies.
- Validates the backend source.
- Packages the backend folder into `backend-package.tar.gz`.
- Uploads the backend package as a GitHub Actions artifact named `backend-package`.

## Railway Delivery

Railway should be used as the delivery platform for deploying the application after the CI workflow succeeds.

Railway delivery responsibilities:

- Deploy the FastAPI backend as a Python web service.
- Deploy or connect the React frontend build to the selected frontend hosting setup.
- Configure environment variables for API keys, dataset paths, database URLs, and service settings.
- Run the backend using the production command required by Railway, such as `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- Use Railway service health checks to verify that the backend is available through `/api/health`.
- Support future database provisioning and dataset import steps through Railway services or environment configuration.

The GitHub Actions delivery workflow can continue to build and package artifacts, while Railway handles the final hosted deployment process.

## Scaling and Availability

Deployment should account for multiple concurrent users and multi-agent workloads. The backend should run as multiple FastAPI instances behind a load balancer so traffic can continue if one instance becomes unhealthy.

The scaling strategy is defined in `deployment_scaling.md` and includes:

- Horizontal backend scaling.
- Load balancing with Nginx.
- Health checks for backend containers.
- Multi-agent workload considerations.
- Rolling deployment and downtime reduction practices.
