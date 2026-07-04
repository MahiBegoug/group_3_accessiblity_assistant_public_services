"""Intent detection for the shared request workflow.

Determines what the user is asking for (search, recommendation, summary,
translation, or general help) regardless of whether the request originated as
typed text or transcribed voice.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Optional


class Intent(str, Enum):
    SEARCH = "search"
    RECOMMEND = "recommend"
    SUMMARY = "summary"
    TRANSLATE = "translate"
    GREETING = "greeting"
    HELP = "help"


@dataclass
class DetectedIntent:
    intent: Intent
    query: str
    params: Dict[str, str] = field(default_factory=dict)


_RECOMMEND_HINTS = (
    "recommend", "suggest", "what should", "where can i", "i want to",
    "i'd like to", "id like to", "looking to", "somewhere to", "place to",
    "activity", "activities", "things to do", "where to",
)
_SUMMARY_HINTS = ("summary", "summarize", "tell me about", "what is", "describe", "details about")
_TRANSLATE_HINTS = ("translate", "translation", "in french", "in spanish", "en français")
_GREETING_HINTS = ("hello", "hi ", "hey", "bonjour", "good morning", "good evening")
_HELP_HINTS = ("help", "what can you do", "how do you work", "who are you")
_ACCESSIBLE_HINTS = (
    "wheelchair", "accessible", "accessibility", "ramp", "stroller",
    "adapted", "disability", "mobility",
)


def _contains(text: str, hints) -> bool:
    return any(h in text for h in hints)


def detect_intent(message: str) -> DetectedIntent:
    text = f" {message.lower().strip()} "
    params: Dict[str, str] = {}

    if _contains(text, _ACCESSIBLE_HINTS):
        params["accessible_only"] = "true"

    borough = _extract_borough(text)
    if borough:
        params["borough"] = borough

    if _contains(text, _TRANSLATE_HINTS):
        return DetectedIntent(Intent.TRANSLATE, message.strip(), params)

    if _contains(text, _SUMMARY_HINTS):
        return DetectedIntent(Intent.SUMMARY, message.strip(), params)

    if _contains(text, _RECOMMEND_HINTS):
        return DetectedIntent(Intent.RECOMMEND, message.strip(), params)

    if _contains(text, _HELP_HINTS):
        return DetectedIntent(Intent.HELP, message.strip(), params)

    if _contains(text, _GREETING_HINTS) and len(text.split()) <= 4:
        return DetectedIntent(Intent.GREETING, message.strip(), params)

    return DetectedIntent(Intent.SEARCH, message.strip(), params)


_BOROUGH_PATTERN = re.compile(r"\bin ([a-zà-ÿ' \-]+?)(?:\.|,|\?|$| that| with| near)")


def _extract_borough(text: str) -> Optional[str]:
    match = _BOROUGH_PATTERN.search(text)
    if match:
        candidate = match.group(1).strip()
        if 2 < len(candidate) < 40:
            return candidate
    return None
