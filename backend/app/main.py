"""EzAccess FastAPI application entry point (Presentation boundary)."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .api.routes import router
from .persistence.place_repository import get_repository

app = FastAPI(
    title=f"{config.APP_NAME} API",
    version=config.APP_VERSION,
    description="Accessibility assistant for Montréal public services.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.on_event("startup")
def warm_up() -> None:
    # Parse the dataset once at startup so the first request is fast.
    get_repository()


@app.get("/")
def root() -> dict:
    return {
        "app": config.APP_NAME,
        "version": config.APP_VERSION,
        "docs": "/docs",
        "health": "/api/health",
    }
