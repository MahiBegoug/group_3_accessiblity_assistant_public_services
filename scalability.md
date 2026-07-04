# Scalability

How **EzAccess** is designed to scale, and what to do to take it further. Each
high-level goal below is made concrete — with the specific mechanism, the
current state in this codebase, and the gap to close — so the goals are
measurable rather than aspirational.

## Goals at a glance

| Goal | Concrete target |
| --- | --- |
| Support concurrent users without slowdown | p95 API latency < 300 ms (excluding external translation) at 200+ concurrent users per backend instance |
| Scale backend horizontally | Add/remove stateless replicas behind a load balancer with no code change |
| Independent deployability | Frontend (static) and backend (API) ship and version separately |
| Failure isolation | A failing translation/summary/recommendation/speech/dataset path degrades gracefully instead of failing the request |
| Reduce downtime | Health checks + load balancing route traffic only to healthy instances |

---

## 1. Support concurrent users without slowing down

**What makes it possible here:** the backend is effectively **read-only and
stateless**. There are no user accounts, no sessions, and no per-request writes
— the Montréal dataset is parsed once into memory at startup and only read
afterward. Requests don't contend on shared mutable state, so throughput scales
with CPU/instances.

**Concrete practices:**

- Keep request handlers **stateless** (no server-side session, no in-request
  disk/DB writes). Any per-user data stays in the browser.
- Serve the dataset from the in-memory repository (`PlaceRepository`), which is
  built once at startup — search/summary/recommend are pure in-memory reads.
- Run backend with multiple worker processes (e.g.
  `uvicorn app.main:app --workers N`) and/or multiple containers.
- Define a **latency budget** and measure it: target p95 < 300 ms for
  `/api/chat`, `/api/search`, `/api/recommend` (translation-free path).
- Load test before claiming a number (e.g. `k6`, `locust`) and record the
  concurrency at which p95 breaches the budget — that is the per-instance
  capacity used for capacity planning.

**Watch-outs:**

- Requests that call the **external translation service** are bounded by that
  network call, not by our CPU — measure and cache those separately (see §4).
- The dataset lives in each instance's memory (~a few thousand rows). This is
  cheap now; if the dataset grows large, move it to a shared store (§2).

---

## 2. Scale backend services horizontally

**What makes it possible here:** because instances share nothing, you can run N
identical backend replicas behind a load balancer and traffic can hit any of
them interchangeably.

**Concrete practices:**

- Package the backend as an immutable image (`backend/Dockerfile`) and run
  multiple replicas (Docker Compose `--scale backend=N`, or Kubernetes
  `Deployment` with `replicas: N` + `HorizontalPodAutoscaler` on CPU).
- Put a load balancer / reverse proxy (nginx, Traefik, or a cloud LB) in front
  and balance across replicas.
- Keep the dataset **read-only** so every replica is a safe, identical copy.

**Gap to close (currently a single-instance assumption):**

- The dataset is loaded per-instance from the bundled CSV. For a much larger
  dataset or frequent updates, move it to a shared, queryable store
  (PostgreSQL/PostGIS for geo queries, or a search index) so replicas don't each
  hold a full copy and data updates don't require a redeploy.
- Externalize any future caching (see §4) to a shared cache (Redis) so replicas
  benefit from each other's work.

---

## 3. Keep frontend and backend independently deployable

**Current state:** they are already decoupled.

- The **React frontend** builds to static assets (`vite build` → `dist/`) and
  can be hosted on any static host or CDN, deployed on its own cadence.
- The **FastAPI backend** is a separate service/image (`backend/Dockerfile`,
  `docker-compose.yml`) exposing a versioned REST API under `/api`.
- The frontend talks to the backend only over HTTP (dev uses the Vite proxy;
  production should use a configurable API base URL / same-origin gateway).

**Concrete practices:**

- Treat the API as a contract: keep response shapes stable (the `/api/chat`
  response, `agentsUsed`, etc.), and version breaking changes (e.g. `/api/v2`).
- Ship frontend and backend in **separate pipelines** so a UI change doesn't
  force a backend redeploy and vice versa.
- Configure CORS / origins per environment (already centralized in
  `backend/app/config.py`).

---

## 4. Protect the system from failures in dependent services

The Business Layer is a **multi-agent system** (translator, summary,
recommender) plus external dependencies (translation endpoint, browser speech,
dataset). Failure in one path should not take down the whole request.

**Already in place:**

- **Translation degrades gracefully:** if the external translator is
  unreachable, `translation_service` returns the original text with an
  `engine: "unavailable"` marker instead of raising — the assistant still
  answers, just untranslated.
- **Speech runs in the browser** (Web Speech API), so speech-to-text and
  text-to-speech add **zero backend load** and can't take the API down. If a
  browser lacks support, the UI falls back to text.
- **Summary/recommendation are pure in-memory functions** over the dataset with
  no external dependency, so they can't fail on network issues.

**Concrete practices to add for production hardening:**

- **Timeouts** on the external translation call so a slow provider can't pile up
  requests (bounded wait, then fall back to original text).
- **Circuit breaker + retry-with-backoff** around translation: after repeated
  failures, stop calling it for a cooldown and serve untranslated text.
- **Caching** of translations (same text + target language) in a shared cache
  (Redis) to cut latency and external calls — translations are deterministic and
  highly repeatable.
- **Per-agent isolation:** a failure in one agent returns a partial, still-useful
  response (e.g. places without translation) rather than a 500.
- **Rate limiting** on public endpoints to protect against abuse and to keep one
  client from degrading others.

---

## 5. Use health checks and load balancing to reduce downtime

**Already in place:**

- **Health endpoint:** `GET /api/health` returns status plus dataset size — a
  cheap readiness signal that also confirms the dataset loaded.
- **Container health check:** `backend/Dockerfile` defines a `HEALTHCHECK` that
  polls `/api/health`, so orchestrators can detect and replace unhealthy
  containers.
- **Startup warm-up:** the dataset is parsed on startup so the first real
  request isn't slow (and readiness can wait for it).

**Concrete practices:**

- Front the replicas with a **load balancer** that routes only to instances
  passing the health check, and drains connections from unhealthy ones.
- Distinguish **liveness** (process is up) from **readiness** (dataset loaded,
  ready to serve) so a warming instance isn't sent traffic prematurely.
- Roll out with **rolling/blue-green deploys** so there's always a healthy pool
  serving traffic during releases.
- Run **≥ 2 replicas** across failure domains so a single instance failure never
  means downtime.

---

## Summary of current state vs. target

- **Strong today:** stateless read-only backend, browser-side speech (no backend
  load), graceful translation fallback, independently deployable frontend/backend,
  health endpoint + container health check, containerized backend.
- **To reach full production scale:** add a load balancer + multi-replica
  deploy, timeouts/circuit breaker/caching around external translation, a shared
  data store if the dataset grows, rate limiting, and readiness-vs-liveness
  separation with rolling deploys.
