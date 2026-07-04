"""Agent Coordinator (Business Layer request coordinator).

Decides which agent(s) should handle each request and chains them when needed
(e.g. a request for recommended places in another language runs the Recommender
Agent first, then the Translator Agent). Merges agent output into one unified
response for text, voice, and map output.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional

from ...persistence.place_repository import PlaceRepository
from .. import map_service
from ..intent import DetectedIntent, Intent, detect_intent
from .base import AgentResult
from .recommender_agent import RecommenderAgent
from .summary_agent import SummaryAgent
from .translator_agent import TranslatorAgent

_DEFAULT_SUGGESTIONS = [
    "Find a wheelchair accessible library",
    "Recommend a park for a family walk",
    "Where can I go swimming?",
    "Tell me about a cultural centre",
]


@dataclass
class AssistantResponse:
    """Unified response the Business Layer returns to the Presentation Layer."""

    reply: str
    intent: str
    places: List[dict] = field(default_factory=list)
    markers: List[dict] = field(default_factory=list)
    bounds: Optional[dict] = None
    translation: Optional[dict] = None
    suggestions: List[str] = field(default_factory=list)
    agents_used: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "reply": self.reply,
            "intent": self.intent,
            "places": self.places,
            "markers": self.markers,
            "bounds": self.bounds,
            "translation": self.translation,
            "suggestions": self.suggestions,
            "agentsUsed": self.agents_used,
        }


class AgentCoordinator:
    """Coordinates the Translator, Summary, and Recommender agents."""

    def __init__(self, repo: PlaceRepository) -> None:
        self.repo = repo
        self.recommender = RecommenderAgent(repo)
        self.summary = SummaryAgent(repo)
        self.translator = TranslatorAgent()

    def agents(self) -> List[dict]:
        return [
            self.recommender.describe(),
            self.summary.describe(),
            self.translator.describe(),
        ]

    def handle(
        self, message: str, target_language: Optional[str] = None
    ) -> AssistantResponse:
        message = (message or "").strip()
        if not message:
            return AssistantResponse(
                reply="I didn't catch that. Try asking me to find or recommend a place.",
                intent=Intent.HELP.value,
                suggestions=_DEFAULT_SUGGESTIONS,
            )

        detected = detect_intent(message)

        if detected.intent == Intent.GREETING:
            return AssistantResponse(
                reply=(
                    "Hi! I'm EzAccess. I can help you find public places in "
                    "Montréal, recommend spots for an activity, summarize a "
                    "location, and translate results. What are you looking for?"
                ),
                intent=detected.intent.value,
                suggestions=_DEFAULT_SUGGESTIONS,
            )

        if detected.intent == Intent.HELP:
            return AssistantResponse(
                reply=(
                    "You can type or speak to me. Ask things like "
                    "\"find an accessible library in Verdun\", "
                    "\"recommend a place to go swimming\", or "
                    "\"tell me about Parc Frédéric-Back\". "
                    "I show results on the map and can read them aloud."
                ),
                intent=detected.intent.value,
                suggestions=_DEFAULT_SUGGESTIONS,
            )

        if detected.intent == Intent.TRANSLATE:
            return self._route_translate(detected, target_language)

        # SEARCH / RECOMMEND / SUMMARY resolve to a set of places.
        return self._route_places(detected, target_language)

    # ------------------------------------------------------------------
    def _route_places(
        self, detected: DetectedIntent, target_language: Optional[str]
    ) -> AssistantResponse:
        borough = detected.params.get("borough")
        accessible_only = detected.params.get("accessible_only") == "true"
        agents_used: List[str] = []

        if detected.intent == Intent.SUMMARY:
            result: AgentResult = self.summary.run(
                detected.query, borough=borough, accessible_only=accessible_only
            )
        else:
            mode = "search" if detected.intent == Intent.SEARCH else "recommend"
            result = self.recommender.run(
                detected.query, borough=borough,
                accessible_only=accessible_only, mode=mode,
            )
        agents_used.append(result.agent)

        if not result.handled or not result.places:
            return AssistantResponse(
                reply=result.reply,
                intent=detected.intent.value,
                suggestions=_DEFAULT_SUGGESTIONS,
                agents_used=agents_used,
            )

        # The Summary Agent enriches every place with a summary for the UI.
        place_dicts = []
        for place in result.places:
            data = place.to_dict()
            data["summary"] = self.summary.summarize(place)
            data["shortSummary"] = self.summary.short_summary(place)
            place_dicts.append(data)

        reply = result.reply
        markers = map_service.to_map_markers(result.places)
        translation = None

        # Chain the Translator Agent when the user wants another language, and
        # translate the whole result set (reply + card summaries + map popups)
        # in one request so the experience is consistent, not half-translated.
        if target_language and target_language not in ("en", "auto"):
            reply, markers = self._translate_bundle(
                reply, place_dicts, markers, target_language
            )
            translation = {"target": target_language}
            agents_used.append(self.translator.name)

        return AssistantResponse(
            reply=reply,
            intent=detected.intent.value,
            places=place_dicts,
            markers=markers,
            bounds=map_service.map_bounds(result.places),
            translation=translation,
            agents_used=agents_used,
        )

    def _translate_bundle(
        self,
        reply: str,
        place_dicts: List[dict],
        markers: List[dict],
        target: str,
    ):
        """Translate reply, place summaries, and popups together (in place)."""
        n = len(place_dicts)
        texts: List[str] = [reply]
        texts += [d.get("summary", "") for d in place_dicts]
        texts += [d.get("shortSummary", "") for d in place_dicts]

        translated, engine = self.translator.translate_lines(texts, target, "en")
        if engine != "google":
            return reply, markers  # translation unavailable → keep originals

        new_reply = translated[0]
        short_by_id: dict = {}
        for i, data in enumerate(place_dicts):
            data["summary"] = translated[1 + i]
            data["shortSummary"] = translated[1 + n + i]
            short_by_id[data["id"]] = data["shortSummary"]

        for marker in markers:
            if marker["id"] in short_by_id:
                marker["shortSummary"] = short_by_id[marker["id"]]

        return new_reply, markers

    def _route_translate(
        self, detected: DetectedIntent, target_language: Optional[str]
    ) -> AssistantResponse:
        target = target_language or "fr"
        result = self.translator.run(detected.query, target=target, source="auto")
        return AssistantResponse(
            reply=result.reply,
            intent=detected.intent.value,
            translation=result.translation,
            agents_used=[result.agent],
        )
