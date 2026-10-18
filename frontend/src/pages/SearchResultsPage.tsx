import { useEffect, useMemo, useRef, useState } from 'react'
import { CloudSun, ListChecks, Ticket } from 'lucide-react'

import { WavePageHeader } from '@/components/layout/WavePageHeader'
import { PlanExportActions } from '@/components/search-results/PlanExportActions'
import { PlanInfoCard } from '@/components/search-results/PlanInfoCard'
import { PlanMapPlaceholder } from '@/components/search-results/PlanMapPlaceholder'
import { PlanTrailMap } from '@/components/search-results/PlanTrailMap'
import { PlanResultsHeader } from '@/components/search-results/PlanResultsHeader'
import { PlanSectionHeading } from '@/components/search-results/PlanSectionHeading'
import { PredefinedRouteCallout } from '@/components/search-results/PredefinedRouteCallout'
import { SearchPlanLoadingScreen } from '@/components/search-results/SearchPlanLoadingScreen'
import { SearchQueryCallout } from '@/components/search-results/SearchQueryCallout'
import { SearchResultCard } from '@/components/search-results/SearchResultCard'
import { PlanPlaceDetailSheet } from '@/components/search-results/PlanPlaceDetailSheet'
import { TrailDetailPanel } from '@/components/search-results/TrailDetailPanel'
import {
  enrichRouteDetailForMap,
  routeHeroLead,
  routeStopsToTrail,
} from '@/lib/predefinedRoutePlan'
import { fetchRouteDetail, type RouteDetail } from '@/lib/routeApi'
import {
  searchNaturalLanguage,
  searchPreferencesFromContext,
  type SearchResponse,
} from '@/lib/searchApi'
import { buildPlanExportDocument } from '@/lib/buildPlanExportDocument'
import { appLayout } from '@/lib/appLayout'
import { loadUserContext } from '@/lib/userContextStorage'
import { cn } from '@/lib/utils'
import { buildTrail, resultKey, type TrailMode } from '@/lib/trail'
import { formatPlanWeatherText, planWeatherCoords } from '@/lib/planWeather'
import { fetchCurrentWeather, type WeatherSnapshot } from '@/lib/weatherApi'
import { fetchWalkingRoute, type WalkingRoute } from '@/lib/walkingRoute'

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

type PlanWeatherState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; snapshot: WeatherSnapshot }
  | { status: 'error' }

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
  const [planWeather, setPlanWeather] = useState<PlanWeatherState>({ status: 'idle' })
  const routeFetchGeneration = useRef(0)

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
      setWalkingRoute(null)
      setRouteLoading(false)
      return
    }
    const controller = new AbortController()
    const generation = routeFetchGeneration.current + 1
    routeFetchGeneration.current = generation
    setRouteLoading(true)
    setWalkingRoute(null)
    fetchWalkingRoute(trailStops, controller.signal)
      .then((route) => {
        if (routeFetchGeneration.current !== generation) {
          return
        }
        setWalkingRoute(route)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        if (routeFetchGeneration.current !== generation) {
          return
        }
        setWalkingRoute(null)
      })
      .finally(() => {
        if (routeFetchGeneration.current === generation) {
          setRouteLoading(false)
        }
      })
    return () => controller.abort()
  }, [trailSignature])

  const weatherCoordsKey = useMemo(() => {
    const { lat, lon } = planWeatherCoords(trailStops)
    return `${lat.toFixed(4)}:${lon.toFixed(4)}`
  }, [trailSignature])

  useEffect(() => {
    if (pageLoading || pageError) {
      setPlanWeather({ status: 'idle' })
      return
    }
    const controller = new AbortController()
    const { lat, lon } = planWeatherCoords(trailStops)
    setPlanWeather({ status: 'loading' })
    fetchCurrentWeather(lat, lon, controller.signal)
      .then((snapshot) => setPlanWeather({ status: 'ready', snapshot }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        setPlanWeather({ status: 'error' })
      })
    return () => controller.abort()
  }, [pageLoading, pageError, weatherCoordsKey])

  const summary = useMemo(() => {
    if (isPredefined && predefinedState.status === 'ready') {
      return routeHeroLead(predefinedState.route)
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

  const weatherContextNote = useMemo(() => {
    if (isPredefined) {
      return null
    }
    if (searchState.status !== 'ready') {
      return null
    }
    return searchState.data.weather_note
  }, [isPredefined, searchState])

  const weather = useMemo(() => {
    if (planWeather.status === 'loading' || planWeather.status === 'idle') {
      return 'Sprawdzamy aktualną pogodę…'
    }
    if (planWeather.status === 'ready') {
      return formatPlanWeatherText(planWeather.snapshot, weatherContextNote)
    }
    if (weatherContextNote) {
      return weatherContextNote
    }
    return 'Nie udało się pobrać aktualnej pogody.'
  }, [planWeather, weatherContextNote])

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

  const selectedItem = useMemo(() => {
    if (!selectedStopKey) {
      return null
    }
    return orderedResults.find((item) => resultKey(item) === selectedStopKey) ?? null
  }, [orderedResults, selectedStopKey])

  const selectedTrailOrder = useMemo(() => {
    if (!selectedStopKey) {
      return undefined
    }
    return trailStops.find((stop) => stop.key === selectedStopKey)?.order
  }, [selectedStopKey, trailStops])

  const planExportDocument = useMemo(() => {
    const title = isPredefined && predefinedRouteName ? predefinedRouteName : 'Twój plan na dziś'
    const contextLabel = isPredefined
      ? `Trasa predefiniowana: ${predefinedRouteName || 'Azymut'}`
      : `Wyszukiwanie: „${query.trim()}”`
    const fallbackResults =
      searchState.status === 'ready' ? searchState.data.results : []
    return buildPlanExportDocument({
      title,
      subtitle: summary,
      contextLabel,
      ticketNote: ticket,
      weatherNote: weather,
      trailStops,
      fallbackResults,
      walkingRoute,
    })
  }, [
    isPredefined,
    predefinedRouteName,
    query,
    summary,
    ticket,
    weather,
    trailStops,
    searchState,
    walkingRoute,
  ])

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
    <div className="relative flex min-h-full flex-col">
      <WavePageHeader
        onBack={onBack}
        header={<PlanResultsHeader planSummary={summary} />}
        contentClassName="pt-[max(1rem,calc(env(safe-area-inset-top)+0.25rem))]"
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <div className={appLayout.planSummaryBlock}>
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
              onSelectStop={setSelectedStopKey}
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

        <div className={appLayout.listStack}>
          <PlanInfoCard icon={Ticket}>{ticket}</PlanInfoCard>
          <PlanInfoCard icon={CloudSun}>{weather}</PlanInfoCard>
        </div>

        <PlanExportActions document={planExportDocument} />
        </div>

        <div className={appLayout.planCatalogBlock} aria-labelledby="search-results-heading">
          <PlanSectionHeading
            id="search-results-heading"
            title={resultsHeading}
            icon={ListChecks}
          />
          {pageError ? <p role="alert">{pageError}</p> : null}
          {!isPredefined &&
          searchState.status === 'ready' &&
          searchState.data.results.length === 0 ? (
            <p className={appLayout.bodyMuted}>
              Nie znaleźliśmy miejsc na te warunki. Wydłuż czas albo poluzuj cenę.
            </p>
          ) : null}
          {isPredefined &&
          predefinedState.status === 'ready' &&
          trailStops.length === 0 ? (
            <p className={appLayout.bodyMuted}>
              Brak przystanków z lokalizacją na mapie dla tej trasy.
            </p>
          ) : null}
          {!pageError ? (
            <ol className={cn('m-0 list-none p-0', appLayout.listStack)}>
              {orderedResults.map((item) => {
                const key = resultKey(item)
                const trailOrder = trailStops.find((stop) => stop.key === key)?.order
                return (
                  <li key={key}>
                    <SearchResultCard
                      item={item}
                      trailOrder={trailOrder}
                      selected={selectedStopKey === key}
                      onSelect={() => setSelectedStopKey(key)}
                    />
                  </li>
                )
              })}
            </ol>
          ) : null}
        </div>
      </div>

      <PlanPlaceDetailSheet
        open={selectedItem !== null}
        item={selectedItem}
        trailOrder={selectedTrailOrder}
        onClose={() => setSelectedStopKey(null)}
      />
    </div>
  )
}
