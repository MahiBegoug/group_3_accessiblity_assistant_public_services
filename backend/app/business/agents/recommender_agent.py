"""Recommender Agent.

Recommends / searches places based on the user's activity, need, or context.
Ranks and filters places using category, location, activity type, and
accessibility details.
"""
from __future__ import annotations

from typing import Optional

from ...persistence.place_repository import PlaceRepository
from .. import recommendation_service
from .base import Agent, AgentResult


class RecommenderAgent(Agent):
    name = "recommender"
    description = "Recommends and searches places by activity, need, or context."

    def __init__(self, repo: PlaceRepository) -> None:
        self.repo = repo

    def run(  # type: ignore[override]
        self,
        query: str,
        borough: Optional[str] = None,
        accessible_only: bool = False,
        limit: int = 6,
        mode: str = "recommend",
        **_: object,
    ) -> AgentResult:
        if mode == "search":
            places = self.repo.search(
                query, limit=max(limit, 8), borough=borough,
                accessible_only=accessible_only,
            )
            verb = "Here are matching places"
        else:
            places = recommendation_service.recommend(
                self.repo, query, limit=limit,
                borough=borough, accessible_only=accessible_only,
            )
            verb = "Here are some recommendations"

        if not places:
            return AgentResult(
                agent=self.name,
                reply=(
                    "I couldn't find a matching public place. Try a different "
                    "activity, category, or borough."
                ),
                handled=False,
            )

        top = places[0]
        access_note = " It offers accessibility features." if top.accessibility else ""
        short = summary_short(top)
        reply = (
            f"{verb}. {top.name} — {short}.{access_note} I found {len(places)} "
            f"option{'s' if len(places) != 1 else ''} and placed them on the map."
        )
        return AgentResult(agent=self.name, reply=reply, places=places)


def summary_short(place) -> str:
    from .. import summary_service

    return summary_service.short_summary(place)
