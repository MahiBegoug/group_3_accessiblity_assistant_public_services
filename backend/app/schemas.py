"""Pydantic request/response schemas for the API (Presentation boundary)."""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., description="Typed text or transcribed voice input")
    targetLanguage: Optional[str] = Field(
        default=None, description="Optional language code to translate the reply into"
    )
    # 'source' is informational only: text and voice share the same workflow.
    source: str = Field(default="text", description="'text' or 'voice'")


class TranslateRequest(BaseModel):
    text: str
    target: str = "fr"
    source: str = "auto"


class RecommendRequest(BaseModel):
    activity: str
    borough: Optional[str] = None
    accessibleOnly: bool = False
    limit: int = 6
