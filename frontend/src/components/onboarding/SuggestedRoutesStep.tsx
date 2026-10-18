import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

import { OnboardingActionBar } from '@/components/onboarding/OnboardingActionBar'
import { OnboardingStepHeading } from '@/components/onboarding/OnboardingStepHeading'
import { SuggestedRouteCard } from '@/components/onboarding/SuggestedRouteCard'
import {
  onboardingPrimaryButtonClass,
  onboardingSecondaryButtonClass,
} from '@/components/onboarding/onboardingButtonStyles'
import { PlanSectionHeading } from '@/components/search-results/PlanSectionHeading'
import { Button } from '@/components/ui/button'
import { listRoutes, type RouteSummary } from '@/lib/routeApi'
import type { TouristGeographyScope } from '@/lib/touristRoutes'
import {
  splitOnboardingRouteSuggestions,
  type OnboardingRouteSuggestions,
} from '@/lib/suggestOnboardingRoutes'

const INTRO = 'Wybierz gotową trasę na dzień albo przejdź dalej bez wyboru.'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; suggestions: OnboardingRouteSuggestions }
  | { status: 'error'; message: string }

type SuggestedRoutesStepProps = {
  interestTagIds: string[]
  geographyScope: TouristGeographyScope
  selectedRouteId: number | null
  onSelectRoute: (routeId: number | null) => void
}

function RouteList({
  routes,
  selectedRouteId,
  onToggle,
}: {
  routes: RouteSummary[]
  selectedRouteId: number | null
  onToggle: (routeId: number) => void
}) {
  return (
    <ol className="flex flex-col gap-3">
      {routes.map((route) => (
        <li key={route.id}>
          <SuggestedRouteCard
            route={route}
            selected={selectedRouteId === route.id}
            onSelect={() => onToggle(route.id)}
          />
        </li>
      ))}
    </ol>
  )
}

export function SuggestedRoutesStep({
  interestTagIds,
  geographyScope,
  selectedRouteId,
  onSelectRoute,
}: SuggestedRoutesStepProps) {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    setLoad({ status: 'loading' })
    listRoutes({ limit: 100, signal: controller.signal })
      .then((routes) => {
        const suggestions = splitOnboardingRouteSuggestions(
          routes,
          interestTagIds,
          geographyScope,
        )
        setLoad({ status: 'ready', suggestions })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        const message = error instanceof Error ? error.message : 'Nie udało się załadować tras.'
        setLoad({ status: 'error', message })
      })
    return () => controller.abort()
  }, [interestTagIds, geographyScope])

  function toggleRoute(routeId: number) {
    onSelectRoute(selectedRouteId === routeId ? null : routeId)
  }

  const ready = load.status === 'ready' ? load.suggestions : null
  const hasAnyRoutes = ready !== null && (ready.forYou.length > 0 || ready.other.length > 0)

  return (
    <>
      <OnboardingStepHeading>{INTRO}</OnboardingStepHeading>
      {load.status === 'loading' ? (
        <p className="text-sm text-muted-foreground" role="status">Ładujemy propozycje tras…</p>
      ) : null}
      {load.status === 'error' ? (
        <p className="text-sm text-muted-foreground" role="alert">
          {load.message} Możesz przejść dalej bez wyboru trasy.
        </p>
      ) : null}
      {load.status === 'ready' && !hasAnyRoutes ? (
        <p className="text-sm text-muted-foreground">
          Brak tras w katalogu — przejdź dalej i wyszukaj miejsca na ekranie głównym.
        </p>
      ) : null}
      {ready && ready.forYou.length > 0 ? (
        <section className="flex flex-col gap-4" aria-labelledby="routes-for-you-heading">
          <PlanSectionHeading
            id="routes-for-you-heading"
            title="Dopasowane do Ciebie"
            icon={Sparkles}
          />
          <RouteList
            routes={ready.forYou}
            selectedRouteId={selectedRouteId}
            onToggle={toggleRoute}
          />
        </section>
      ) : null}
      {ready && ready.other.length > 0 ? (
        <section
          className="mt-6 flex flex-col gap-4"
          aria-labelledby="routes-other-heading"
        >
          <PlanSectionHeading id="routes-other-heading" title="Inne trasy" />
          <RouteList
            routes={ready.other}
            selectedRouteId={selectedRouteId}
            onToggle={toggleRoute}
          />
        </section>
      ) : null}
      {hasAnyRoutes ? (
        <button
          type="button"
          onClick={() => onSelectRoute(null)}
          className="mt-4 text-center text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          Pominę — wybiorę sam
        </button>
      ) : null}
    </>
  )
}

export function SuggestedRoutesStepActions({
  onBack,
  onNext,
}: {
  onBack: () => void
  onNext: () => void
}) {
  return (
    <OnboardingActionBar>
      <Button
        type="button"
        className={onboardingPrimaryButtonClass}
        size="default"
        onClick={onNext}
      >
        Dalej
      </Button>
      <Button
        type="button"
        variant="outline"
        className={onboardingSecondaryButtonClass}
        size="default"
        onClick={onBack}
      >
        Wstecz
      </Button>
    </OnboardingActionBar>
  )
}
