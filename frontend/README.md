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

Opens at [http://localhost:5173](http://localhost:5173) by default. The home screen uses a phone mock frame when `VITE_DEVICE_MOCK=true` (default).

`VITE_API_BASE_URL` is reserved for future API integration (default `http://127.0.0.1:8000`).

## Environment

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | FastAPI base URL (no trailing slash) |
| `VITE_DEVICE_MOCK` | `true` — Marvel `devices.css` iPhone frame; `false` — full-width mobile layout |

## UI stack

- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (`new-york`, blue theme)
- [lucide-react](https://lucide.dev/) icons
- [devices.css](https://github.com/marvelapp/devices.css) (`public/vendor/devices.min.css`)

Home screen design spec: [docs/superpowers/specs/2026-10-17-home-screen-design.md](../docs/superpowers/specs/2026-10-17-home-screen-design.md).

## Flow (mock)

1. **Home** — wyszukiwarka AI.
2. **Wyniki** (`SearchResultsPage`) — po wysłaniu zapytania; dane z `src/data/searchResultsPlaceholders.ts`. Przycisk „Wróć” wraca na home (stan w `App.tsx`, bez react-router na razie).

Build plan: [backend/docs/build-plan/MASTER-PLAN.md](../backend/docs/build-plan/MASTER-PLAN.md).
