# Technological Stack

## Overview

The application uses a modern web-based stack that supports text interaction, voice interaction, map visualization, translation, summaries, recommendations, and dataset-driven public service discovery.

The main technologies are:

- React for the Presentation Layer
- FastAPI with Python for the backend API and Business Layer
- Python data processing for CSV parsing and dataset modeling
- A database layer for storing structured public service location data

## Presentation Layer

The Presentation Layer should be implemented using React.

React is responsible for the user-facing interface and should support all user specification features.

Main responsibilities:

- Build the text input interface for user questions and requests.
- Build the voice input interface, including microphone controls.
- Display assistant responses as text.
- Provide controls for voice output using text-to-speech.
- Display an interactive map with markers for public service locations.
- Display place summaries, recommendations, and translated content.
- Provide accessible UI components that support keyboard navigation, screen readers, and clear visual feedback.

Recommended frontend technologies:

- React for building reusable UI components.
- TypeScript for safer frontend development.
- A map library such as Leaflet, React Leaflet, or Mapbox GL JS for interactive maps.
- Browser Speech APIs or a speech service integration for voice input and voice output.
- A frontend testing tool such as Jest, Vitest, or React Testing Library.

## Business Layer and API Layer

The backend should be implemented using FastAPI with Python.

FastAPI is responsible for exposing API endpoints to the React frontend and coordinating the Business Layer logic, including the multi-agent system.

Main responsibilities:

- Receive requests from the React frontend.
- Process text requests and normalized voice requests.
- Coordinate the Translator Agent, Summary Agent, and Recommender Agent.
- Provide endpoints for summaries, translations, recommendations, map results, and place search.
- Communicate with the Persistence Layer to access modeled dataset records.
- Communicate with external APIs when needed, such as translation, speech-to-text, text-to-speech, or map services.
- Return structured JSON responses to the frontend.

Recommended backend technologies:

- Python as the main backend programming language.
- FastAPI for REST API development.
- Pydantic for request validation and response models.
- Uvicorn as the ASGI server for local development and deployment.
- Pytest for backend unit and integration testing.

API routes and endpoint responsibilities are defined separately in `api_routes.md`.

## Multi-Agent System

The multi-agent system should be implemented inside the FastAPI/Python backend as part of the Business Layer.

Agents:

- Translator Agent: translates user-facing text from one language to another.
- Summary Agent: generates short summaries for public places and services.
- Recommender Agent: recommends places based on user activities, needs, location, or accessibility preferences.

The React frontend should not directly manage agent logic. It should send user requests to FastAPI, and FastAPI should coordinate the correct agent or agents.

## Persistence Layer

The Persistence Layer should be implemented in Python and should manage the Montreal public places dataset:

https://donnees.montreal.ca/dataset/lieux-batiments-vocation-publique

Main responsibilities:

- Download or load the CSV dataset.
- Parse CSV rows into structured Python models.
- Validate dataset fields using Pydantic or similar validation tools.
- Provide repository methods for searching, filtering, and retrieving places.
- Prepare data for summaries, recommendations, translations, and map display.

Recommended technologies:

- Python CSV utilities or Pandas for CSV loading and preprocessing.
- Pydantic models for structured place data.
- Repository classes or service modules for dataset access.

## Database Layer

The Database Layer stores structured records imported from the CSV dataset.

Possible database options:

- SQLite for a simple local prototype.
- PostgreSQL for a more scalable production-ready database.
- PostGIS with PostgreSQL if advanced geographic queries are needed.

The selected database should support:

- Storing public service location records.
- Querying by category, activity, borough, location, and accessibility details.
- Returning latitude and longitude values for map display.
- Preserving references to the original dataset source.

## Communication Between Frontend and Backend

React communicates with FastAPI through HTTP API calls.

Typical flow:

```text
React UI
   |
   v
FastAPI endpoint
   |
   v
Business Layer / Multi-Agent System
   |
   v
Persistence Layer
   |
   v
Database Layer
```

The backend should return JSON responses that the frontend can display as text, voice output, summaries, recommendations, translations, or map markers.

