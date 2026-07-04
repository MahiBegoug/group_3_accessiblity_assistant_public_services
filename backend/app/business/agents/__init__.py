"""Multi-Agent System (Business Layer).

Internal Business Layer components that separate the main application logic into
focused, single-responsibility agents. Each agent shares the same dataset access
(via the Persistence Layer repository) and returns a common structured result.

Agents:
- TranslatorAgent   - translate assistant text / place info between languages
- SummaryAgent      - generate concise, accessible place summaries
- RecommenderAgent  - recommend / search places by activity, need, or context

The :class:`AgentCoordinator` decides which agent(s) handle each request and can
chain agents together (e.g. recommend places, then translate the response).
"""

from .base import Agent, AgentResult
from .coordinator import AgentCoordinator
from .recommender_agent import RecommenderAgent
from .summary_agent import SummaryAgent
from .translator_agent import TranslatorAgent

__all__ = [
    "Agent",
    "AgentResult",
    "AgentCoordinator",
    "RecommenderAgent",
    "SummaryAgent",
    "TranslatorAgent",
]
