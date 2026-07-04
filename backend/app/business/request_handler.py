"""Shared request handling for text and voice.

Voice input is converted to text by the Presentation Layer before it reaches
here, so this handler treats every request identically. It detects intent,
calls the relevant service, and returns a structured result the Presentation
Layer can render as text, voice, and/or map markers.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional

from ..persistence.place_repository import PlaceRepository
from . import map_service, recommendation_service, summary_service, translation_service
from .intent import DetectedIntent, Intent, detect_intent


@dataclass
class AssistantResponse:
    """Structured result of processing one user request."""

    reply: str
    intent: str
    places: List[dict] = field(default_factory=list)
    markers: List[dict] = field(default_factory=list)
    bounds: Optional[dict] = None
    translation: Optional[dict] = None
    suggestions: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "reply": self.reply,
            "intent": self.intent,
            "places": self.places,
            "markers": self.markers,
            "bounds": self.bounds,
            "translation": self.translation,
            "suggestions": self.suggestions,
        }


_DEFAULT_SUGGESTIONS = [
    "Find a wheelchair accessible library",
    "Recommend a park for a family walk",
    "Where can I go swimming?",
    "Tell me about a cultural centre",
]


class RequestHandler:
    """Coordinates intent processing across the business services."""

    def __init__(self, repo: PlaceRepository) -> None:
        self.repo = repo

    def handle(
        self,
        message: str,
        target_language: Optional[str] = None,
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
            return self._handle_translate(detected, target_language)

        # SEARCH, RECOMMEND, SUMMARY all resolve to a set of places.
        return self._handle_places(detected, target_language)

    # ------------------------------------------------------------------
    def _handle_places(
        self, detected: DetectedIntent, target_language: Optional[str]
    ) -> AssistantResponse:
        borough = detected.params.get("borough")
        accessible_only = detected.params.get("accessible_only") == "true"

        if detected.intent == Intent.RECOMMEND:
            places = recommendation_service.recommend(
                self.repo, detected.query, limit=6,
                borough=borough, accessible_only=accessible_only,
            )
            verb = "Here are some recommendations"
        elif detected.intent == Intent.SUMMARY:
            places = self.repo.search(detected.query, limit=3, borough=borough,
                                      accessible_only=accessible_only)
            verb = "Here's what I found"
        else:
            places = self.repo.search(detected.query, limit=8, borough=borough,
                                      accessible_only=accessible_only)
            verb = "Here are matching places"

        if not places:
            return AssistantResponse(
                reply=(
                    "I couldn't find a matching public place. Try a different "
                    "activity, category, or borough."
                ),
                intent=detected.intent.value,
                suggestions=_DEFAULT_SUGGESTIONS,
            )

        place_dicts = []
        for place in places:
            data = place.to_dict()
            data["summary"] = summary_service.summarize(place)
            data["shortSummary"] = summary_service.short_summary(place)
            place_dicts.append(data)

        top = places[0]
        access_note = " It offers accessibility features." if top.accessibility else ""
        if detected.intent == Intent.SUMMARY:
            reply = summary_service.summarize(top)
        else:
            reply = (
                f"{verb}. {top.name} — {summary_service.short_summary(top)}."
                f"{access_note} I found {len(places)} option"
                f"{'s' if len(places) != 1 else ''} and placed them on the map."
            )

        translation = None
        if target_language and target_language not in ("en", "auto"):
            tr = translation_service.translate(reply, target_language, "en")
            reply = tr.translated
            translation = {
                "target": target_language,
                "engine": tr.engine,
            }

        return AssistantResponse(
            reply=reply,
            intent=detected.intent.value,
            places=place_dicts,
            markers=map_service.to_map_markers(places),
            bounds=map_service.map_bounds(places),
            translation=translation,
        )

    def _handle_translate(
        self, detected: DetectedIntent, target_language: Optional[str]
    ) -> AssistantResponse:
        target = target_language or "fr"
        result = translation_service.translate(detected.query, target, "auto")
        if result.engine == "unavailable":
            reply = (
                "Translation service is not reachable right now, so here is the "
                "original text unchanged."
            )
        else:
            reply = result.translated
        return AssistantResponse(
            reply=reply,
            intent=detected.intent.value,
            translation={
                "original": result.original,
                "translated": result.translated,
                "target": result.target,
                "engine": result.engine,
            },
        )
