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

Opens at [http://localhost:5173](http://localhost:5173) by default. With `VITE_DEVICE_MOCK=true` (default), a phone mock frame appears on viewports **≥ 768px**; on narrower screens (typical phones) the app is full-bleed.

With the FastAPI backend running on port **8000**, `npm run dev` proxies browser requests from `/api/*` to the API (see `vite.config.ts`). Leave `VITE_API_BASE_URL` unset or empty so the app uses relative URLs through that proxy.

## Environment

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Optional FastAPI base URL (no trailing slash). Empty = Vite proxy in dev. Set for production builds or to call the API directly. |
| `VITE_DEVICE_MOCK` | `true` — iPhone frame on viewports ≥ 768px, full-bleed below; `false` — always full-width |

## UI stack

- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (`new-york`, blue theme)
- [lucide-react](https://lucide.dev/) icons
- [devices.css](https://github.com/marvelapp/devices.css) (`public/vendor/devices.min.css`)

Home screen design spec: [docs/superpowers/specs/2026-10-17-home-screen-design.md](../docs/superpowers/specs/2026-10-17-home-screen-design.md).

## Flow (mock)

1. **Onboarding** (`OnboardingPage`) — pierwsze uruchomienie; zapis `localStorage` (`azymut_user_context_v1`). Aby powtórzyć: wyczyść ten klucz w devtools.
2. **Home** — wyszukiwarka AI.
3. **Wyniki** (`SearchResultsPage`) — po wysłaniu zapytania; dane z `src/data/searchResultsPlaceholders.ts`. Przycisk „Wróć” wraca na home (stan w `App.tsx`, bez react-router na razie).

Onboarding spec: [docs/superpowers/specs/2026-10-17-onboarding-design.md](../docs/superpowers/specs/2026-10-17-onboarding-design.md).

Build plan: [backend/docs/build-plan/MASTER-PLAN.md](../backend/docs/build-plan/MASTER-PLAN.md).
