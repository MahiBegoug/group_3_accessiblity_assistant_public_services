"""Application configuration.

Central place for settings so the dataset source or other options can change
without touching business or presentation logic.
"""
from __future__ import annotations

import os
from pathlib import Path

# Repository root is two levels up from this file (backend/app/config.py).
REPO_ROOT = Path(__file__).resolve().parents[2]
DATASET_DIR = REPO_ROOT / "dataset"

# Primary (English) dataset used to build the in-memory database.
DATASET_EN = Path(os.getenv("EZACCESS_DATASET_EN", DATASET_DIR / "lieux-en.csv"))
DATASET_FR = Path(os.getenv("EZACCESS_DATASET_FR", DATASET_DIR / "lieux-fr.csv"))

SOURCE_DATASET = "Montreal open data - lieux et batiments a vocation publique"
SOURCE_URL = "https://donnees.montreal.ca/dataset/lieux-batiments-vocation-publique"

# CORS origins allowed to reach the API (Vite dev server defaults).
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

APP_NAME = "EzAccess"
APP_VERSION = "1.0.0"
