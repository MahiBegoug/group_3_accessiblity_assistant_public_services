# EzAccess

An accessibility assistant for discovering and understanding **Montréal public services**.
Users interact by **text or voice**, and receive answers as **text, voice, an interactive
map, place summaries, translations, and activity-based recommendations**.

Built on the [Montréal open dataset of public places and buildings](https://donnees.montreal.ca/dataset/lieux-batiments-vocation-publique).

- **Frontend:** ReactJS + TypeScript (Vite), Framer Motion micro-animations, Leaflet map
- **Backend:** FastAPI (Python), layered architecture

---

## Architecture

The backend implements the four-layer architecture from `architecture.md`:

```
Presentation (React UI + REST API boundary)
      │
Business Layer      backend/app/business/   intent + shared request handler
  └─ Multi-Agent    backend/app/business/agents/
     System           AgentCoordinator routes each request to:
                        • RecommenderAgent  (search / activity recommendations)
                        • SummaryAgent      (concise place summaries)
                        • TranslatorAgent   (translate replies / place info)
      │
Persistence Layer   backend/app/persistence/ Place model, CSV loader, repository
      │
Database Layer      dataset/lieux-en.csv     Montréal public places dataset
```

Text and voice share **one workflow**: voice is transcribed to text in the browser,
then processed exactly like typed input by the Business Layer.

### Multi-agent system

The Business Layer is organized as a multi-agent system. The `AgentCoordinator`
decides which agent handles each request and **chains agents when needed** — for
example, "recommend a park in French" runs the Recommender Agent, then the
Translator Agent. Every agent shares the same dataset access (the Persistence
Layer repository) and returns a common `AgentResult`, which the coordinator merges
into one unified response for text, voice, and map output. Each chat response
reports which agents participated (`agentsUsed`), shown as chips in the UI.

---

## Prerequisites

- Python 3.9+
- Node.js 18+
- (Optional) Docker + Docker Compose — to run the backend in a container

---

## Quick start (one command)

The easiest way to install dependencies and run **both** the backend and
frontend together:

```bash
./setup_env.sh
```

- Frontend: http://localhost:5173
- Backend: http://127.0.0.1:8000 (docs at `/docs`)
- Press `Ctrl+C` to stop everything cleanly.

Run the backend in Docker instead (frontend still runs natively):

```bash
./setup_env.sh --docker
```

Prefer to start the services manually? See the sections below.

---

## Run the backend (FastAPI)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- API root: http://127.0.0.1:8000
- Interactive docs: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/api/health

### Run the backend with Docker

The backend is containerized. From the repository root:

```bash
docker compose up --build backend
```

This builds the image from `backend/Dockerfile` (bundling the dataset) and
serves the API on http://127.0.0.1:8000. Stop it with `docker compose down`.

You can also build/run the image directly (note the build context is the repo
root so the dataset is included):

```bash
docker build -f backend/Dockerfile -t ezaccess-backend .
docker run -p 8000:8000 ezaccess-backend
```

---

## Run the frontend (React + TypeScript)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend on
port 8000, so no extra configuration is needed.

To build for production: `npm run build` then `npm run preview`.

---

## Features → Specifications

| User story                     | Where it lives                                                        |
| ------------------------------ | --------------------------------------------------------------------- |
| Text communication             | Chat panel + `POST /api/chat`                                         |
| Voice communication            | Browser Speech Recognition (`useSpeechRecognition`) → shared `/chat` |
| Text & voice output            | On-screen text + "Read aloud" + selectable TTS voice (`useSpeechSynthesis`) |
| Interactive map                | Leaflet map with markers, popups, and fly-to on selection            |
| Place summaries                | `agents/summary_agent.py`, shown on cards, map popups, and chat      |
| Text translation               | `agents/translator_agent.py` + `POST /api/translate`                 |
| Activity-based recommendations | `agents/recommender_agent.py` (intent → `recommend`)                 |

The voice used for spoken responses can be changed from the **voice picker** in
the header (with a preview button); it defaults to the most natural-sounding
voice available for the selected language.

### Try it

- "find a wheelchair accessible library in Verdun"
- "recommend a place to go swimming"
- "tell me about a cultural centre"
- Pick a language (top right) to get replies translated
- Toggle **Read aloud** or press the mic to speak

---

## Key API endpoints

| Method | Path                | Purpose                                       |
| ------ | ------------------- | --------------------------------------------- |
| POST   | `/api/chat`         | Shared text/voice request → structured reply  |
| POST   | `/api/recommend`    | Activity-based recommendations                |
| POST   | `/api/translate`    | Translate text to a target language           |
| GET    | `/api/search`       | Keyword search over places                    |
| GET    | `/api/places/{id}`  | A single place with a full summary            |
| GET    | `/api/metadata`     | Boroughs, categories, dataset info            |
| GET    | `/api/languages`    | Supported translation languages               |
| GET    | `/api/agents`       | Describes the Business Layer agents           |
| GET    | `/api/health`       | Service + dataset status                      |

---

## Notes

- **Voice input/output** uses the browser Web Speech API. It works best in
  Chrome/Edge; if unavailable, the app gracefully falls back to text.
- **Translation** uses `deep-translator` (Google backend, no API key). If the
  network is unavailable it degrades gracefully and returns the original text.
- The dataset is parsed into memory at startup (~2,400 located places).
