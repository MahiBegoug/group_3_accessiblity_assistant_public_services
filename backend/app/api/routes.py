"""HTTP routes bridging the Presentation Layer to the Business Layer."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from .. import config
from ..business import summary_service, translation_service
from ..business.recommendation_service import recommend
from ..business.request_handler import RequestHandler
from ..persistence.place_repository import get_repository
from ..schemas import ChatRequest, RecommendRequest, TranslateRequest

router = APIRouter(prefix="/api")


def _handler() -> RequestHandler:
    return RequestHandler(get_repository())


@router.get("/health")
def health() -> dict:
    repo = get_repository()
    return {
        "status": "ok",
        "app": config.APP_NAME,
        "version": config.APP_VERSION,
        "places": repo.count(),
    }


@router.post("/chat")
def chat(payload: ChatRequest) -> dict:
    """Shared entry point for text and (already transcribed) voice requests."""
    response = _handler().handle(payload.message, payload.targetLanguage)
    return response.to_dict()


@router.post("/recommend")
def recommend_places(payload: RecommendRequest) -> dict:
    repo = get_repository()
    places = recommend(
        repo,
        payload.activity,
        limit=payload.limit,
        borough=payload.borough,
        accessible_only=payload.accessibleOnly,
    )
    place_dicts = []
    for place in places:
        data = place.to_dict()
        data["summary"] = summary_service.summarize(place)
        data["shortSummary"] = summary_service.short_summary(place)
        place_dicts.append(data)
    return {"places": place_dicts, "count": len(place_dicts)}


@router.post("/translate")
def translate(payload: TranslateRequest) -> dict:
    result = translation_service.translate(payload.text, payload.target, payload.source)
    return {
        "original": result.original,
        "translated": result.translated,
        "source": result.source,
        "target": result.target,
        "engine": result.engine,
    }


@router.get("/languages")
def languages() -> dict:
    return {"languages": translation_service.SUPPORTED_LANGUAGES}


@router.get("/agents")
def agents() -> dict:
    """Describe the Business Layer multi-agent system."""
    return {"agents": _handler().agents()}


@router.get("/places/{place_id}")
def get_place(place_id: str) -> dict:
    repo = get_repository()
    place = repo.get(place_id)
    if place is None:
        raise HTTPException(status_code=404, detail="Place not found")
    data = place.to_dict()
    data["summary"] = summary_service.summarize(place)
    data["shortSummary"] = summary_service.short_summary(place)
    return data


@router.get("/search")
def search(
    q: str = Query("", description="Search query"),
    limit: int = Query(8, ge=1, le=50),
    borough: Optional[str] = None,
    accessibleOnly: bool = False,
) -> dict:
    repo = get_repository()
    places = repo.search(q, limit=limit, borough=borough, accessible_only=accessibleOnly)
    place_dicts = []
    for place in places:
        data = place.to_dict()
        data["shortSummary"] = summary_service.short_summary(place)
        place_dicts.append(data)
    return {"places": place_dicts, "count": len(place_dicts)}


@router.get("/metadata")
def metadata() -> dict:
    repo = get_repository()
    return {
        "boroughs": repo.boroughs(),
        "categories": repo.categories()[:60],
        "count": repo.count(),
        "source": {"name": config.SOURCE_DATASET, "url": config.SOURCE_URL},
    }
