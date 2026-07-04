#!/usr/bin/env bash
#
# EzAccess — easy setup.
# Installs dependencies (once) and runs the backend + frontend together.
#
# Usage:
#   ./setup_env.sh            Run backend (native venv) + frontend together
#   ./setup_env.sh --docker   Run backend in Docker + frontend natively
#   ./setup_env.sh --help     Show this help
#
# Press Ctrl+C to stop everything cleanly.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

MODE="native"
for arg in "$@"; do
  case "$arg" in
    --docker) MODE="docker" ;;
    -h|--help)
      # Print only the leading comment block (skip the shebang).
      awk 'NR==1{next} /^#/{sub(/^# ?/,""); print; next} {exit}' "$0"
      exit 0
      ;;
    *) echo "Unknown option: $arg (use --help)"; exit 1 ;;
  esac
done

BACKEND_PID=""
FRONTEND_PID=""
DOCKER_UP=""

log()  { printf '\033[1;34m[EzAccess]\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33m[EzAccess]\033[0m %s\n' "$1"; }
die()  { printf '\033[1;31m[EzAccess]\033[0m %s\n' "$1"; exit 1; }

require() { command -v "$1" >/dev/null 2>&1 || die "Required tool not found: $1"; }

# Recursively terminate a process and all of its descendants. Needed because
# `npm run dev` spawns a child `vite` process that would otherwise be orphaned.
kill_tree() {
  local pid="$1" child
  [[ -z "$pid" ]] && return
  for child in $(pgrep -P "$pid" 2>/dev/null); do
    kill_tree "$child"
  done
  kill -TERM "$pid" 2>/dev/null || true
}

cleanup() {
  echo
  log "Shutting down..."
  kill_tree "$FRONTEND_PID"
  kill_tree "$BACKEND_PID"
  if [[ -n "$DOCKER_UP" ]]; then
    ( cd "$ROOT_DIR" && ${DOCKER_COMPOSE:-docker compose} down ) 2>/dev/null || true
  fi
  wait 2>/dev/null || true
  log "Done."
}
trap cleanup EXIT INT TERM

# ----------------------------------------------------------------------
# Backend
# ----------------------------------------------------------------------
start_backend_native() {
  require python3
  log "Setting up backend (Python venv)..."
  cd "$BACKEND_DIR"
  if [[ ! -d ".venv" ]]; then
    python3 -m venv .venv
  fi
  # shellcheck disable=SC1091
  source .venv/bin/activate
  pip install --quiet --upgrade pip
  pip install --quiet -r requirements.txt
  log "Starting backend on http://127.0.0.1:8000 ..."
  uvicorn app.main:app --host 127.0.0.1 --port 8000 &
  BACKEND_PID=$!
  deactivate || true
  cd "$ROOT_DIR"
}

start_backend_docker() {
  require docker
  if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
  else
    die "Docker Compose not found."
  fi
  log "Building and starting backend in Docker on http://127.0.0.1:8000 ..."
  ( cd "$ROOT_DIR" && $DOCKER_COMPOSE up --build -d backend )
  DOCKER_UP="1"
}

# ----------------------------------------------------------------------
# Frontend
# ----------------------------------------------------------------------
start_frontend() {
  require npm
  log "Setting up frontend (npm)..."
  cd "$FRONTEND_DIR"
  if [[ ! -d "node_modules" ]]; then
    npm install
  fi
  log "Starting frontend dev server (http://localhost:5173) ..."
  npm run dev &
  FRONTEND_PID=$!
  cd "$ROOT_DIR"
}

# ----------------------------------------------------------------------
# Run
# ----------------------------------------------------------------------
log "Mode: $MODE"

if [[ "$MODE" == "docker" ]]; then
  start_backend_docker
else
  start_backend_native
fi

start_frontend

echo
log "EzAccess is starting up."
log "  Frontend : http://localhost:5173"
log "  Backend  : http://127.0.0.1:8000  (docs at /docs)"
log "Press Ctrl+C to stop."
echo

# Keep the script alive while the services run.
wait
