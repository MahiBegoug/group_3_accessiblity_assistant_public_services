"""CSV parsing for the Montreal public places dataset.

Turns raw CSV rows into ``Place`` objects. This is the only module that knows
about the raw CSV column layout.
"""
from __future__ import annotations

import csv
import hashlib
from pathlib import Path
from typing import List, Optional

from .. import config
from .models import Place


def _split_multi(value: str) -> List[str]:
    """Split a comma/semicolon separated cell into clean tokens."""
    if not value:
        return []
    raw = value.replace(";", ",")
    return [part.strip() for part in raw.split(",") if part.strip()]


def _to_float(value: str) -> Optional[float]:
    if not value:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _make_id(name: str, address: str, url: str) -> str:
    basis = url or f"{name}|{address}"
    return hashlib.md5(basis.encode("utf-8")).hexdigest()[:12]


def load_places(path: Path | None = None) -> List[Place]:
    """Load and parse the dataset CSV into ``Place`` entities."""
    csv_path = Path(path) if path else config.DATASET_EN
    if not csv_path.exists():
        raise FileNotFoundError(f"Dataset not found: {csv_path}")

    places: List[Place] = []
    with csv_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            name = (row.get("titre_lieu") or "").strip()
            if not name:
                continue

            address_parts = [
                (row.get("adresse_principale") or "").strip(),
                (row.get("adresse_secondaire") or "").strip(),
            ]
            address = ", ".join(p for p in address_parts if p)
            url = (row.get("url_fiche") or "").strip()

            place = Place(
                id=_make_id(name, address, url),
                name=name,
                description=(row.get("description") or "").strip(),
                category=(row.get("categories") or row.get("types") or "").strip(),
                types=(row.get("types") or "").strip(),
                address=address,
                borough=(row.get("arrondissements") or "").strip(),
                city=(row.get("ville") or "").strip(),
                postal_code=(row.get("code_postal") or "").strip(),
                latitude=_to_float(row.get("lat", "")),
                longitude=_to_float(row.get("long", "")),
                activities=_split_multi(row.get("activites", "")),
                facilities=_split_multi(row.get("installations", "")),
                amenities=_split_multi(row.get("commodites", "")),
                accessibility=_split_multi(row.get("accessibilite", "")),
                opening_status=(row.get("statut_ouverture") or "").strip(),
                schedule=(row.get("horaire_par_jour") or "").strip(),
                phone=(row.get("telephone") or "").strip(),
                email=(row.get("courriel") or "").strip(),
                url=url,
                source_dataset=config.SOURCE_DATASET,
                source_url=config.SOURCE_URL,
            )

            place.search_index = " ".join(
                [
                    place.name,
                    place.description,
                    place.category,
                    place.types,
                    place.borough,
                    place.address,
                    " ".join(place.activities),
                    " ".join(place.facilities),
                    " ".join(place.amenities),
                    " ".join(place.accessibility),
                ]
            ).lower()

            places.append(place)

    return places
