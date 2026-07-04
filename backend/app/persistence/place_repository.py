"""Repository providing data-access methods over the loaded places.

Acts as the in-memory Database Layer + access methods. The Business Layer only
ever talks to this repository, never to the CSV loader directly.
"""
from __future__ import annotations

import math
import re
from typing import Dict, Iterable, List, Optional

from .csv_loader import load_places
from .models import Place

_STOPWORDS = {
    "a", "an", "the", "of", "for", "to", "in", "on", "at", "and", "or",
    "with", "near", "me", "my", "i", "want", "would", "like", "looking",
    "find", "show", "place", "places", "where", "can", "is", "are", "do",
    "some", "any", "please", "need", "get", "go", "going", "there", "here",
    "about", "tell", "give", "recommend", "recommendation", "recommendations",
    "suggest", "suggestion", "montreal", "montréal",
}


def _tokenize(text: str) -> List[str]:
    tokens = re.findall(r"[a-zà-ÿ0-9']+", text.lower())
    return [t for t in tokens if t not in _STOPWORDS and len(t) > 1]


class PlaceRepository:
    """In-memory repository with search and filtering helpers."""

    def __init__(self, places: Optional[List[Place]] = None) -> None:
        self._places: List[Place] = places if places is not None else load_places()
        self._by_id: Dict[str, Place] = {p.id: p for p in self._places}

    # -- basic access ---------------------------------------------------
    def all(self) -> List[Place]:
        return list(self._places)

    def count(self) -> int:
        return len(self._places)

    def get(self, place_id: str) -> Optional[Place]:
        return self._by_id.get(place_id)

    def boroughs(self) -> List[str]:
        return sorted({p.borough for p in self._places if p.borough})

    def categories(self) -> List[str]:
        values = set()
        for p in self._places:
            if p.category:
                values.update(part.strip() for part in p.category.split(","))
            if p.types:
                values.update(part.strip() for part in p.types.split(","))
        return sorted(v for v in values if v)

    # -- scoring / search ----------------------------------------------
    def _score(self, place: Place, tokens: Iterable[str]) -> int:
        score = 0
        name = place.name.lower()
        for token in tokens:
            if token in name:
                score += 5
            if token in place.category.lower() or token in place.types.lower():
                score += 3
            if any(token in a.lower() for a in place.activities):
                score += 3
            if token in place.borough.lower():
                score += 2
            if any(token in a.lower() for a in place.accessibility):
                score += 2
            if token in place.search_index:
                score += 1
        return score

    def search(
        self,
        query: str,
        limit: int = 8,
        borough: Optional[str] = None,
        accessible_only: bool = False,
    ) -> List[Place]:
        tokens = _tokenize(query)
        candidates = self._places

        if borough:
            b = borough.lower()
            candidates = [p for p in candidates if b in p.borough.lower()]
        if accessible_only:
            candidates = [p for p in candidates if p.accessibility]

        if not tokens:
            base = [p for p in candidates if p.latitude and p.longitude]
            return base[:limit]

        scored = [(self._score(p, tokens), p) for p in candidates]
        scored = [pair for pair in scored if pair[0] > 0]
        scored.sort(key=lambda pair: pair[0], reverse=True)
        return [p for _, p in scored[:limit]]

    def filter_by_activity(self, activity: str, limit: int = 8) -> List[Place]:
        return self.search(activity, limit=limit)

    def nearby(self, lat: float, lon: float, limit: int = 8) -> List[Place]:
        def dist(p: Place) -> float:
            if p.latitude is None or p.longitude is None:
                return math.inf
            return (p.latitude - lat) ** 2 + (p.longitude - lon) ** 2

        located = [p for p in self._places if p.latitude and p.longitude]
        located.sort(key=dist)
        return located[:limit]


# Module-level singleton so the dataset is parsed only once per process.
_repository: Optional[PlaceRepository] = None


def get_repository() -> PlaceRepository:
    global _repository
    if _repository is None:
        _repository = PlaceRepository()
    return _repository
