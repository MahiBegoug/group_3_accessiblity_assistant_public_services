"""Data model for the Persistence Layer."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class Place:
    """A structured public place / building entity.

    Fields mirror the useful columns available in the Montreal dataset while
    keeping the model application-friendly (see architecture.md).
    """

    id: str
    name: str
    description: str
    category: str
    types: str
    address: str
    borough: str
    city: str
    postal_code: str
    latitude: Optional[float]
    longitude: Optional[float]
    activities: List[str] = field(default_factory=list)
    facilities: List[str] = field(default_factory=list)
    amenities: List[str] = field(default_factory=list)
    accessibility: List[str] = field(default_factory=list)
    opening_status: str = ""
    schedule: str = ""
    phone: str = ""
    email: str = ""
    url: str = ""
    source_dataset: str = ""
    source_url: str = ""

    # Precomputed lowercase search blob (filled by the loader).
    search_index: str = ""

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "types": self.types,
            "address": self.address,
            "borough": self.borough,
            "city": self.city,
            "postalCode": self.postal_code,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "activities": self.activities,
            "facilities": self.facilities,
            "amenities": self.amenities,
            "accessibility": self.accessibility,
            "openingStatus": self.opening_status,
            "schedule": self.schedule,
            "phone": self.phone,
            "email": self.email,
            "url": self.url,
            "sourceDataset": self.source_dataset,
            "sourceUrl": self.source_url,
        }
