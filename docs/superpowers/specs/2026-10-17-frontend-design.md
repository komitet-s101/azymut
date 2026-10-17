# Frontend design — M5 mobile + admin

**Date:** 2026-10-17  
**Status:** Implemented in `frontend/`

## Summary

React 19 + Vite + Tailwind v4 + shadcn/ui (Radix). Light theme only. Mobile-first full-width app. Admin CRUD at `/admin`.

## Mobile flows

- Persona gate (`/welcome`) → localStorage `UserContext`
- Bottom nav: Plan, Odkrywaj, W pobliżu, Ustawienia
- `POST /api/v1/plan` wired in UI; graceful errors until M4 backend
- Plan result from sessionStorage; map pins via Leaflet

## Admin

- Places and routes CRUD when `ADMIN_ENABLED=true`
- Desktop layout, Polish labels

## Key paths

- `frontend/src/api/` — client + types
- `frontend/src/features/` — mobile screens
- `frontend/src/admin/` — admin screens

See [backend/docs/build-plan/MASTER-PLAN.md](../../backend/docs/build-plan/MASTER-PLAN.md) for product scope.
