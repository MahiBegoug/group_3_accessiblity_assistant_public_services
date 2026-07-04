"""Generates clear, accessible summaries for public places."""
from __future__ import annotations

from ..persistence.models import Place


def _clean_sentence(text: str, max_len: int = 220) -> str:
    text = " ".join(text.split())
    if len(text) <= max_len:
        return text
    trimmed = text[:max_len].rsplit(" ", 1)[0]
    return f"{trimmed}…"


def summarize(place: Place) -> str:
    """Build a short, human-readable summary of a place."""
    parts: list[str] = []

    kind = place.category or place.types
    if kind:
        parts.append(f"{place.name} is a {kind.lower()}")
    else:
        parts.append(place.name)

    if place.borough:
        parts[-1] += f" in {place.borough}"
    parts[-1] += "."

    if place.description:
        parts.append(_clean_sentence(place.description))

    if place.activities:
        parts.append("Activities include " + ", ".join(place.activities[:4]) + ".")

    if place.accessibility:
        parts.append("Accessibility: " + ", ".join(place.accessibility[:5]) + ".")

    if place.opening_status:
        parts.append(f"Current status: {place.opening_status}.")

    return " ".join(parts).strip()


def short_summary(place: Place) -> str:
    """A one-line summary used in list cards and map popups."""
    kind = (place.category or place.types or "Public place").split(",")[0].strip()
    location = place.borough or place.city or "Montréal"
    access = " · Accessible" if place.accessibility else ""
    return f"{kind} in {location}{access}"
