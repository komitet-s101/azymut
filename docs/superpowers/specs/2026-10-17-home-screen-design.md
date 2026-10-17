# Home screen — design spec (frontend MVP)

**Status:** approved for implementation (2026-10-17)  
**Product:** Inteligentny planer wolnego czasu (Sierpc / Gostynin)  
**Screen role:** Główny **home** po onboardingu — użytkownik wraca tutaj między sesjami planowania.

## Kontekst produktu

Aplikacja agreguje wydarzenia i miejsca, personalizuje propozycje (profil, pakiety zainteresowań, język naturalny + LLM) i buduje wykonalne plany. Szczegóły domeny: [backend/docs/scope.md](../../backend/docs/scope.md).

Home skupia się na dwóch akcjach:

1. **Szybkie zapytanie w NL** — pole wyszukiwania z AI (na razie UI-only).
2. **Inspiracja** — podgląd nadchodzących wydarzeń dopasowanych do preferencji (na razie statyczne placeholdery).

Powiązanie z modelem użytkownika: [backend/docs/build-plan/design/user-persona-llm-design.md](../../backend/docs/build-plan/design/user-persona-llm-design.md). W tej iteracji **nie** odczytujemy `interest_package_id` z local storage — sekcja wydarzeń jest wizualnym preview.

## User story

> Jako użytkownik po onboardingu wracam do aplikacji. Od razu widzę markę i mogę opisać, jak chcę spędzić czas. Pod spodem dostaję podpowiedzi w postaci nadchodzących wydarzeń.

## Layout (mobile ~390px)

Trzy pionowe strefy (zgodnie z wireframe, z poprawkami poniżej):

```
┌─────────────────────────┐
│ Logo + motto            │  ← jasne tło na hero (biały tekst na niebieskim w hero)
├─────────────────────────┤
│  [  AI search pill   ]  │  ← hero niebieski
│         ∿∿∿∿            │  ← SVG wave → białe body
├─────────────────────────┤
│ Nagłówek sekcji         │
│ ┌─────────────────────┐ │
│ │ placeholder img     │ │
│ │ tytuł · data        │ │
│ └─────────────────────┘ │
│ (2–3 karty)             │
└─────────────────────────┘
```

### Poprawki względem wireframe

1. Jedno pole search w kształcie **pill** (ikona Sparkles + placeholder + ikona Search).
2. **Fala SVG** jako separator hero / treść.
3. Karty: placeholder miniatury, tytuł, data z ikoną kalendarza, chip kategorii (np. Muzyka, Teatr).
4. **Safe area** (`env(safe-area-inset-*)`) w nagłówku i na dole listy.
5. Status API backendu **nie** na ekranie demo — opcjonalnie tylko w trybie dev (`import.meta.env.DEV`).

## Design tokens

| Token | Wartość | Użycie |
|-------|---------|--------|
| Brand hero | `#0B3D91` | Tło hero (`--primary`) |
| Brand accent | `#2563EB` | Akcenty, focus ring |
| Brand light | `#EFF6FF` | Chip / subtelne tła |
| Text on hero | `#FFFFFF` | Logo area na hero |
| Text body | `#0F172A` | Treść na białym |
| Border | `#BFDBFE` | Obramowania kart |

shadcn mapuje `--primary` na hero; reszta przez Tailwind utility i zmienne w `index.css`.

## Komponenty (shadcn + własne)

| UI | shadcn / lib |
|----|----------------|
| Search pill | `Input` + lucide `Sparkles`, `Search` |
| Karty wydarzeń | `Card`, `Badge` |
| Miniatura | `aspect-video` + `bg-muted` (bez `Skeleton` w MVP) |

### Ikony (lucide-react)

- `Sparkles` — AI w search
- `Search` — akcja wyszukiwania
- `CalendarDays` — data na karcie
- `MapPin` — opcjonalnie na karcie (dekoracja)

## Copy (PL)

| Element | Tekst |
|---------|--------|
| Motto | Precyzyjny namiar na to, co dzieje się tuż obok, |
| Search placeholder | Opisz, jak chcesz spędzić czas… |
| Search `aria-label` | Wyszukiwanie planu w języku naturalnym |
| Sekcja wydarzeń | Nadchodzące wydarzenia dla Ciebie |
| Chip kategorii | Muzyka, Teatr, Kultura (przykłady) |
| Placeholder tytuł | Nazwa wydarzenia |
| Placeholder data | Data i godzina |

## Placeholder data

Statyczna tablica w `frontend/src/data/homePlaceholders.ts`:

```ts
{ id, title, dateLabel, category: string }
```

2–3 wpisy, **bez** wywołań API.

## devices.css (Marvel)

- Ramka: `.marvel-device.iphone-x` > `.screen` ze scrollowaną treścią.
- CSS: plik w `frontend/public/vendor/devices.min.css` (offline demo).
- Flaga `VITE_DEVICE_MOCK` (domyślnie `true`): `false` = pełna szerokość bez ramki.

## Dostępność

- `html lang="pl"`.
- Hierarchia: obszar marki jako `h1` (wizualnie logo + motto), sekcja wydarzeń `h2`.
- Search: widoczny label przez `aria-label`; przycisk search `type="submit"` w `<form>`.
- Kontrast białego tekstu na `#0B3D91` ≥ WCAG AA dla normalnego tekstu.

## Poza zakresem (następne kroki)

- React Router, onboarding, ustawienia persony.
- Integracja `GET /events` (lub przyszły endpoint katalogu).
- Submit search → LLM / planner pipeline.
- PWA, mapa Leaflet.

## Pliki implementacji

- `frontend/src/pages/HomePage.tsx`
- `frontend/src/components/layout/DeviceFrame.tsx`
- `frontend/src/components/home/*`
- `frontend/public/brand/logo.png`
