"""Coordinates translation from one language to another.

Uses ``deep-translator`` (Google backend, no API key) when the network is
available and gracefully degrades to a pass-through with a note otherwise, so
the rest of the app keeps working offline.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

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


def translate_lines(
    texts: List[str], target: str, source: str = "en"
) -> Tuple[List[str], str]:
    """Translate many short strings in a single request.

    Strings are joined with newlines and translated together, then split back,
    which keeps the whole result set consistent in the target language with one
    network call instead of one per string. Returns (translated, engine); on any
    mismatch or failure the originals are returned unchanged.
    """
    if not texts or not target or target in ("en", "auto"):
        return list(texts), "none"

    # Collapse internal newlines so the join delimiter stays 1:1 with inputs.
    cleaned = [(t or "").replace("\n", " ").strip() for t in texts]
    joined = "\n".join(cleaned)

    try:
        from deep_translator import GoogleTranslator

        src = source if source and source != "auto" else "auto"
        out = GoogleTranslator(source=src, target=target).translate(joined)
        parts = out.split("\n") if out else []
        if len(parts) == len(cleaned):
            return [p.strip() for p in parts], "google"
    except Exception:  # noqa: BLE001 - offline / network / lib fallback
        pass

    return list(texts), "unavailable"
