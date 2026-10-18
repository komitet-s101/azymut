import { useEffect, useMemo, useState } from 'react'
import { CloudSun, Ticket } from 'lucide-react'

import { WavePageHeader } from '@/components/layout/WavePageHeader'
import { PlanInfoCard } from '@/components/search-results/PlanInfoCard'
import { PlanMapPlaceholder } from '@/components/search-results/PlanMapPlaceholder'
import { PlanTrailMap } from '@/components/search-results/PlanTrailMap'
import { PlanResultsHeader } from '@/components/search-results/PlanResultsHeader'
import { PlanSectionHeading } from '@/components/search-results/PlanSectionHeading'
import { PredefinedRouteCallout } from '@/components/search-results/PredefinedRouteCallout'
import { SearchPlanLoadingScreen } from '@/components/search-results/SearchPlanLoadingScreen'
import { SearchQueryCallout } from '@/components/search-results/SearchQueryCallout'
import { SearchResultCard } from '@/components/search-results/SearchResultCard'
import { TrailDetailPanel } from '@/components/search-results/TrailDetailPanel'
import {
  enrichRouteDetailForMap,
  routePlanSummary,
  routeStopsToTrail,
} from '@/lib/predefinedRoutePlan'
import { fetchRouteDetail, type RouteDetail } from '@/lib/routeApi'
import {
  searchNaturalLanguage,
  searchPreferencesFromContext,
  type SearchResponse,
} from '@/lib/searchApi'
import { loadUserContext } from '@/lib/userContextStorage'
import { buildTrail, resultKey, type TrailMode } from '@/lib/trail'
import { fetchWalkingRoute, straightLineRoute, type WalkingRoute } from '@/lib/walkingRoute'

type SearchResultsPageProps = {
  query: string
  predefinedRouteId?: number | null
  onBack: () => void
}

type SearchLoadState =
  | { status: 'loading' }
  | { status: 'ready'; data: SearchResponse }
  | { status: 'error'; message: string }

type PredefinedLoadState =
  | { status: 'loading' }
  | { status: 'ready'; route: RouteDetail }
  | { status: 'error'; message: string }

export function SearchResultsPage({
  query,
  predefinedRouteId = null,
  onBack,
}: SearchResultsPageProps) {
  const isPredefined = predefinedRouteId !== null && predefinedRouteId > 0

  const [searchState, setSearchState] = useState<SearchLoadState>({ status: 'loading' })
  const [predefinedState, setPredefinedState] = useState<PredefinedLoadState>({
    status: 'loading',
  })
  const [selectedStopKey, setSelectedStopKey] = useState<string | null>(null)
  const [walkingRoute, setWalkingRoute] = useState<WalkingRoute | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)

  useEffect(() => {
    if (isPredefined) {
      return
    }
    const controller = new AbortController()
    setSearchState({ status: 'loading' })
    setSelectedStopKey(null)
    const userPreferences = searchPreferencesFromContext(loadUserContext())
    searchNaturalLanguage(query, controller.signal, userPreferences)
      .then((data) => setSearchState({ status: 'ready', data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        const message = error instanceof Error ? error.message : 'Nie udało się wyszukać.'
        setSearchState({ status: 'error', message })
      })
    return () => controller.abort()
  }, [query, isPredefined])

  useEffect(() => {
    if (!isPredefined || predefinedRouteId === null) {
      return
    }
    const controller = new AbortController()
    setPredefinedState({ status: 'loading' })
    setSelectedStopKey(null)
    fetchRouteDetail(predefinedRouteId, controller.signal)
      .then((route) => enrichRouteDetailForMap(route, controller.signal))
      .then((route) => setPredefinedState({ status: 'ready', route }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        const message = error instanceof Error ? error.message : 'Nie udało się załadować trasy.'
        setPredefinedState({ status: 'error', message })
      })
    return () => controller.abort()
  }, [isPredefined, predefinedRouteId])

  const trailPlan = useMemo(() => {
    if (isPredefined) {
      if (predefinedState.status !== 'ready') {
        return { stops: [], mode: null as TrailMode | null }
      }
      return { stops: routeStopsToTrail(predefinedState.route), mode: 'place' as TrailMode }
    }
    if (searchState.status !== 'ready') {
      return { stops: [], mode: null as TrailMode | null }
    }
    return buildTrail(
      searchState.data.results,
      query,
      searchState.data.filter?.time_budget_minutes ?? null,
      searchState.data.filter?.stop_count ?? null,
    )
  }, [isPredefined, predefinedState, searchState, query])

  const trailStops = trailPlan.stops
  const trailSignature = trailStops.map((stop) => `${stop.key}:${stop.lat}:${stop.lon}`).join('|')
  const pageLoading = isPredefined
    ? predefinedState.status === 'loading'
    : searchState.status === 'loading'
  const pageError =
    isPredefined && predefinedState.status === 'error'
      ? predefinedState.message
      : !isPredefined && searchState.status === 'error'
        ? searchState.message
        : null

  useEffect(() => {
    if (trailStops.length < 2) {
      setWalkingRoute(trailStops.length === 1 ? straightLineRoute(trailStops) : null)
      setRouteLoading(false)
      return
    }
    const controller = new AbortController()
    setRouteLoading(true)
    setWalkingRoute(straightLineRoute(trailStops))
    fetchWalkingRoute(trailStops, controller.signal)
      .then((route) => setWalkingRoute(route))
      .catch(() => setWalkingRoute(straightLineRoute(trailStops)))
      .finally(() => setRouteLoading(false))
    return () => controller.abort()
  }, [trailSignature])

  const summary = useMemo(() => {
    if (isPredefined && predefinedState.status === 'ready') {
      return routePlanSummary(predefinedState.route)
    }
    if (!isPredefined && searchState.status === 'ready') {
      return searchState.data.summary
    }
    if (isPredefined) {
      return 'Ładujemy trasę…'
    }
    return query
  }, [isPredefined, predefinedState, searchState, query])

  const predefinedRouteName =
    isPredefined && predefinedState.status === 'ready' ? predefinedState.route.name : ''

  const weather = isPredefined
    ? 'Sprawdź prognozę przed wyjściem — szczegóły na kartach przystanków.'
    : searchState.status === 'ready'
      ? (searchState.data.weather_note ?? 'Pogoda nie zmieniła kolejności wyników.')
      : 'Sprawdzamy pogodę…'

  const ticket = isPredefined
    ? 'Ceny i bilety są przy każdym przystanku poniżej.'
    : searchState.status === 'ready' && searchState.data.results[0]
      ? searchState.data.results[0].price_level === 0
        ? 'Najlepszy wynik jest bezpłatny albo ma niepewną cenę — szczegóły na kartach.'
        : 'Ceny są na kartach poniżej. Niepotwierdzone nie są traktowane jako darmowe.'
      : 'Ceny pojawią się przy wynikach.'

  const orderedResults = useMemo(() => {
    if (isPredefined) {
      return trailStops.map((stop) => stop.result)
    }
    if (searchState.status !== 'ready') {
      return []
    }
    if (trailStops.length > 0) {
      return [
        ...trailStops.map((stop) => stop.result),
        ...searchState.data.results.filter(
          (item) => !trailStops.some((stop) => stop.key === resultKey(item)),
        ),
      ]
    }
    return searchState.data.results
  }, [isPredefined, trailStops, searchState])

  const resultsHeading = 'Pasujące miejsca i wydarzenia'
  const showTrailMap =
    !pageError &&
    (trailStops.length > 0 ||
      (isPredefined && predefinedRouteId !== null && predefinedState.status === 'loading'))
  const mapKey = isPredefined
    ? `predefined-${predefinedRouteId ?? 'none'}`
    : `search-${query}`

  const loadingMessage = isPredefined
    ? 'Ładujemy trasę…'
    : 'Wyszukujemy dla Ciebie spersonalizowane doznanie…'

  if (pageLoading) {
    return (
      <div className="flex min-h-full flex-col">
        <WavePageHeader
          onBack={onBack}
          header={<PlanResultsHeader planSummary={summary} />}
          contentClassName="pt-[max(1rem,calc(env(safe-area-inset-top)+0.25rem))]"
        />
        <SearchPlanLoadingScreen message={loadingMessage} />
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <WavePageHeader
        onBack={onBack}
        header={<PlanResultsHeader planSummary={summary} />}
        contentClassName="pt-[max(1rem,calc(env(safe-area-inset-top)+0.25rem))]"
      />
      <div className="home-surface-texture flex flex-1 flex-col gap-8 px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {isPredefined ? (
          <PredefinedRouteCallout
            routeName={predefinedRouteName}
            durationMinutesApprox={
              predefinedState.status === 'ready'
                ? predefinedState.route.duration_minutes_approx
                : null
            }
            city={
              predefinedState.status === 'ready' ? predefinedState.route.city : null
            }
            gmina={
              predefinedState.status === 'ready' ? predefinedState.route.gmina : null
            }
            stopsMin={
              predefinedState.status === 'ready' ? predefinedState.route.stops_min : undefined
            }
            stopsMax={
              predefinedState.status === 'ready' ? predefinedState.route.stops_max : undefined
            }
          />
        ) : (
          <SearchQueryCallout query={query} />
        )}

        {showTrailMap ? (
          <>
            <PlanTrailMap
              mapKey={mapKey}
              stops={trailStops}
              route={walkingRoute}
              routeLoading={routeLoading || (isPredefined && pageLoading)}
              selectedKey={selectedStopKey}
              onSelectStop={setSelectedStopKey}
            />
            <TrailDetailPanel
              stops={trailStops}
              trailMode={trailPlan.mode}
              selectedKey={selectedStopKey}
              walkingRoute={walkingRoute}
            />
          </>
        ) : !isPredefined ? (
          <PlanMapPlaceholder
            label={
              searchState.status === 'ready' && searchState.data.results.length > 0
                ? 'Brak powiązanej trasy — poniżej osobne propozycje'
                : 'Pokaż na mapie'
            }
          />
        ) : null}

        <div className="flex flex-col gap-3">
          <PlanInfoCard icon={Ticket}>{ticket}</PlanInfoCard>
          <PlanInfoCard icon={CloudSun}>{weather}</PlanInfoCard>
        </div>

        <section className="flex flex-col gap-4" aria-labelledby="search-results-heading">
          <PlanSectionHeading id="search-results-heading" title={resultsHeading} />
          {pageError ? <p role="alert">{pageError}</p> : null}
          {!isPredefined &&
          searchState.status === 'ready' &&
          searchState.data.results.length === 0 ? (
            <p>Nie znaleźliśmy miejsc na te warunki. Wydłuż czas albo poluzuj cenę.</p>
          ) : null}
          {isPredefined &&
          predefinedState.status === 'ready' &&
          trailStops.length === 0 ? (
            <p>Brak przystanków z lokalizacją na mapie dla tej trasy.</p>
          ) : null}
          {!pageError ? (
            <ol className="flex flex-col gap-3">
              {orderedResults.map((item) => {
                const key = resultKey(item)
                const trailOrder = trailStops.find((stop) => stop.key === key)?.order
                return (
                  <li key={key}>
                    <SearchResultCard
                      item={item}
                      trailOrder={trailOrder}
                      selected={trailOrder !== undefined && selectedStopKey === key}
                      onSelect={
                        trailOrder !== undefined ? () => setSelectedStopKey(key) : undefined
                      }
                    />
                  </li>
                )
              })}
            </ol>
          ) : null}
        </section>
      </div>
    </div>
  )
}
