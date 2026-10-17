# Leisure planner — mobile client

React + TypeScript + Vite PWA shell for the hackathon leisure planner (Sierpc / Gostynin).

## Setup

```bash
npm install
cp .env.example .env
```

## Run dev server

```bash
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173) by default. Ensure the backend is running and `VITE_API_BASE_URL` points at it (default `http://127.0.0.1:8000`).

## Environment

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | FastAPI base URL (no trailing slash) |

Build plan: [backend/docs/build-plan/MASTER-PLAN.md](../backend/docs/build-plan/MASTER-PLAN.md).
