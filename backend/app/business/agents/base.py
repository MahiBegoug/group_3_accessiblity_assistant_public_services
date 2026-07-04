"""Shared agent interface and result type for the multi-agent system."""
from __future__ import annotations

import abc
from dataclasses import dataclass, field
from typing import List, Optional

from ...persistence.models import Place


@dataclass
class AgentResult:
    """Structured result returned by every agent to the Business Layer.

    Keeping one shared shape lets the coordinator merge the output of multiple
    agents (e.g. recommend + translate) into a single unified response.
    """

    agent: str
    reply: str = ""
    places: List[Place] = field(default_factory=list)
    translation: Optional[dict] = None
    suggestions: List[str] = field(default_factory=list)
    handled: bool = True


class Agent(abc.ABC):
    """Base class for a Business Layer agent.

    Every agent has a stable ``name`` and a ``describe`` summary so the
    coordinator (and API) can report which agents participated in a request.
    """

    name: str = "agent"
    description: str = ""

    @abc.abstractmethod
    def run(self, **kwargs) -> AgentResult:
        """Execute the agent and return a structured result."""
        raise NotImplementedError

    def describe(self) -> dict:
        return {"name": self.name, "description": self.description}
