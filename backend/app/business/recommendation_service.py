"""Activity-based recommendation logic."""
from __future__ import annotations

from typing import List, Optional

from ..persistence.place_repository import PlaceRepository
from ..persistence.models import Place


def recommend(
    repo: PlaceRepository,
    query: str,
    limit: int = 6,
    borough: Optional[str] = None,
    accessible_only: bool = False,
) -> List[Place]:
    """Recommend places matching an activity or need."""
    results = repo.search(
        query,
        limit=limit,
        borough=borough,
        accessible_only=accessible_only,
    )
    if results:
        return results

    # Relax filters progressively so the user always gets options to compare.
    if accessible_only or borough:
        results = repo.search(query, limit=limit)
    if not results:
        results = [p for p in repo.all() if p.latitude and p.longitude][:limit]
    return results
