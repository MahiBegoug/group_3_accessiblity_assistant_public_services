"""Translator Agent.

Handles requests where the user wants information translated from one language
to another, preserving meaning. Returns translated text to the Business Layer so
it can be displayed or read aloud.
"""
from __future__ import annotations

from typing import List, Tuple

from .. import translation_service
from .base import Agent, AgentResult


class TranslatorAgent(Agent):
    name = "translator"
    description = "Translates assistant text and place information between languages."

    def run(  # type: ignore[override]
        self,
        text: str,
        target: str,
        source: str = "auto",
        **_: object,
    ) -> AgentResult:
        result = translation_service.translate(text, target, source)

        if result.engine == "unavailable":
            reply = (
                "Translation service is not reachable right now, so here is the "
                "original text unchanged."
            )
        else:
            reply = result.translated

        return AgentResult(
            agent=self.name,
            reply=reply,
            translation={
                "original": result.original,
                "translated": result.translated,
                "source": result.source,
                "target": result.target,
                "engine": result.engine,
            },
        )

    def translate_text(self, text: str, target: str, source: str = "auto") -> str:
        """Helper used by the coordinator when chaining after another agent."""
        if not target or target in ("en", "auto"):
            return text
        result = translation_service.translate(text, target, source)
        return result.translated if result.engine != "unavailable" else text

    def translate_lines(
        self, texts: List[str], target: str, source: str = "en"
    ) -> Tuple[List[str], str]:
        """Translate several strings together (one request) for consistency."""
        return translation_service.translate_lines(texts, target, source)

    @staticmethod
    def supported_languages() -> dict:
        return translation_service.SUPPORTED_LANGUAGES
