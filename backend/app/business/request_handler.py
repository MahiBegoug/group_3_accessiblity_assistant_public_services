"""Shared request handling for text and voice (Business Layer facade).

Voice input is converted to text by the Presentation Layer before it reaches
here, so this handler treats every request identically. It delegates to the
:class:`AgentCoordinator`, which decides which agent(s) — Translator, Summary,
or Recommender — should handle the request and chains them when needed.
"""
from __future__ import annotations

from typing import Optional

from ..persistence.place_repository import PlaceRepository
from .agents.coordinator import AgentCoordinator, AssistantResponse

__all__ = ["RequestHandler", "AssistantResponse"]


class RequestHandler:
    """Business Layer entry point backed by the multi-agent coordinator."""

    def __init__(self, repo: PlaceRepository) -> None:
        self.repo = repo
        self.coordinator = AgentCoordinator(repo)

    def handle(
        self,
        message: str,
        target_language: Optional[str] = None,
    ) -> AssistantResponse:
        return self.coordinator.handle(message, target_language)

    def agents(self):
        return self.coordinator.agents()
