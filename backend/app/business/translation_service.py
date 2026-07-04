"""Coordinates translation from one language to another.

Uses ``deep-translator`` (Google backend, no API key) when the network is
available and gracefully degrades to a pass-through with a note otherwise, so
the rest of the app keeps working offline.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

SUPPORTED_LANGUAGES: Dict[str, str] = {
    "en": "English",
    "fr": "French",
    "es": "Spanish",
    "ar": "Arabic",
    "zh-CN": "Chinese (Simplified)",
    "pt": "Portuguese",
    "it": "Italian",
    "de": "German",
    "ht": "Haitian Creole",
    "pa": "Punjabi",
}


@dataclass
class TranslationResult:
    original: str
    translated: str
    source: str
    target: str
    engine: str


def translate(text: str, target: str, source: str = "auto") -> TranslationResult:
    text = (text or "").strip()
    if not text:
        return TranslationResult("", "", source, target, "none")

    try:
        from deep_translator import GoogleTranslator

        src = source if source and source != "auto" else "auto"
        translated = GoogleTranslator(source=src, target=target).translate(text)
        return TranslationResult(text, translated, source, target, "google")
    except Exception:  # noqa: BLE001 - offline / network / lib fallback
        return TranslationResult(
            original=text,
            translated=text,
            source=source,
            target=target,
            engine="unavailable",
        )
