"""Prepares structured place data for the interactive map."""
from __future__ import annotations

from typing import List

from ..persistence.models import Place
from . import summary_service


def to_map_markers(places: List[Place]) -> List[dict]:
    """Return only the fields the map needs, for located places."""
    markers = []
    for place in places:
        if place.latitude is None or place.longitude is None:
            continue
        markers.append(
            {
                "id": place.id,
                "name": place.name,
                "latitude": place.latitude,
                "longitude": place.longitude,
                "category": place.category or place.types,
                "borough": place.borough,
                "shortSummary": summary_service.short_summary(place),
                "accessible": bool(place.accessibility),
            }
        )
    return markers


def map_bounds(places: List[Place]) -> dict | None:
    coords = [
        (p.latitude, p.longitude)
        for p in places
        if p.latitude is not None and p.longitude is not None
    ]
    if not coords:
        return None
    lats = [c[0] for c in coords]
    lons = [c[1] for c in coords]
    return {
        "south": min(lats),
        "north": max(lats),
        "west": min(lons),
        "east": max(lons),
    }
