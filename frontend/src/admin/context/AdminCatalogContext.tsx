import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  fetchCatalogEvents,
  fetchCatalogPlaces,
  fetchCatalogRoutes,
  type CatalogEvent,
  type CatalogPlace,
} from '@/admin/lib/adminCatalogApi'
import type { RouteSummary } from '@/lib/routeApi'

type AdminCatalogState = {
  places: CatalogPlace[]
  events: CatalogEvent[]
  routes: RouteSummary[]
  loading: boolean
  error: string | null
}

const AdminCatalogContext = createContext<AdminCatalogState | null>(null)

export function AdminCatalogProvider({ children }: { children: ReactNode }) {
  const [places, setPlaces] = useState<CatalogPlace[]>([])
  const [events, setEvents] = useState<CatalogEvent[]>([])
  const [routes, setRoutes] = useState<RouteSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    void (async () => {
      try {
        const [placeRows, eventRows, routeRows] = await Promise.all([
          fetchCatalogPlaces(controller.signal),
          fetchCatalogEvents(controller.signal),
          fetchCatalogRoutes(controller.signal),
        ])
        setPlaces(placeRows)
        setEvents(eventRows)
        setRoutes(routeRows)
      } catch (err) {
        if (controller.signal.aborted) {
          return
        }
        const message =
          err instanceof Error ? err.message : 'Nie udało się załadować danych z API.'
        setError(message)
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    })()

    return () => controller.abort()
  }, [])

  const value = useMemo(
    () => ({ places, events, routes, loading, error }),
    [places, events, routes, loading, error],
  )

  return <AdminCatalogContext.Provider value={value}>{children}</AdminCatalogContext.Provider>
}

export function useAdminCatalog(): AdminCatalogState {
  const ctx = useContext(AdminCatalogContext)
  if (!ctx) {
    throw new Error('useAdminCatalog must be used within AdminCatalogProvider')
  }
  return ctx
}
