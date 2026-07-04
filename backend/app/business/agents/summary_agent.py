"""Summary Agent.

Creates short, understandable summaries of places from the dataset using
available fields (name, category, borough, activities, accessibility details).
"""
from __future__ import annotations

from typing import List, Optional

from ...persistence.models import Place
from ...persistence.place_repository import PlaceRepository
from .. import summary_service
from .base import Agent, AgentResult


class SummaryAgent(Agent):
    name = "summary"
    description = "Generates concise, accessible summaries of public places."

    def __init__(self, repo: PlaceRepository) -> None:
        self.repo = repo

    def run(  # type: ignore[override]
        self,
        query: str,
        borough: Optional[str] = None,
        accessible_only: bool = False,
        limit: int = 3,
        **_: object,
    ) -> AgentResult:
        places = self.repo.search(
            query, limit=limit, borough=borough, accessible_only=accessible_only
        )
        if not places:
            return AgentResult(
                agent=self.name,
                reply=(
                    "I couldn't find a matching public place to summarize. Try a "
                    "different name, category, or borough."
                ),
                handled=False,
            )

        reply = summary_service.summarize(places[0])
        return AgentResult(agent=self.name, reply=reply, places=places)

    def summarize(self, place: Place) -> str:
        return summary_service.summarize(place)

    def short_summary(self, place: Place) -> str:
        return summary_service.short_summary(place)
