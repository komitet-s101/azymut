# Hackathon — leisure time planner (Sierpc / Gostynin)

Split workspace: **backend** (FastAPI) and **frontend** (Vite React).

## Run locally (two terminals)

**Backend** (port 8000):

```bash
cd backend
uv sync
cp .env.example .env   # optional
uv run tortoise migrate
uv run backend
```

**Frontend** (port 5173):

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — the home screen should show API status **ok** when the backend is up.

## Docs

- Roadmap: [backend/docs/build-plan/MASTER-PLAN.md](backend/docs/build-plan/MASTER-PLAN.md)
- Backend: [backend/README.md](backend/README.md)
- Frontend: [frontend/README.md](frontend/README.md)
