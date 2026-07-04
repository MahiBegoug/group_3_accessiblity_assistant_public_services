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

## Future Deployment Extension

No production hosting target has been defined yet. When a deployment target is selected, the delivery workflow can be extended with deployment steps for:

- Static hosting for the React frontend.
- A Python web service host for the FastAPI backend.
- Environment variable configuration for API keys and database settings.
- Database migration or dataset import steps.
