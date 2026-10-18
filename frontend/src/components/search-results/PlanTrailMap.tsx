import { useEffect } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'

import { PlanMapLoadingPlaceholder } from '@/components/search-results/PlanMapLoadingPlaceholder'
import { Card } from '@/components/ui/card'
import { appLayout } from '@/lib/appLayout'
import { cn } from '@/lib/utils'
import type { WalkingRoute } from '@/lib/walkingRoute'
import type { TrailStop } from '@/lib/trail'

type LatLngTuple = [number, number]

type PlanTrailMapProps = {
  stops: TrailStop[]
  route: WalkingRoute | null
  routeLoading: boolean
  selectedKey: string | null
  onSelectStop: (key: string) => void
  /** Wymusza ponowne zamontowanie mapy (np. po wejściu z onboardingu). */
  mapKey?: string
}

function stopIcon(order: number, selected: boolean): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:28px;height:28px;border-radius:9999px;
      background:${selected ? '#0b3d91' : '#ffffff'};
      color:${selected ? '#ffffff' : '#0b3d91'};
      border:2px solid #0b3d91;font-weight:700;font-size:13px;
      box-shadow:0 2px 6px rgba(15,23,42,0.25);
    ">${order}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

function FitTrailBounds({ positions }: { positions: LatLngTuple[] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length === 0) {
      return
    }
    if (positions.length === 1) {
      map.setView(positions[0], 14)
      return
    }
    map.fitBounds(L.latLngBounds(positions), { padding: [36, 36], maxZoom: 15 })
  }, [map, positions])
  return null
}

const DEFAULT_CENTER: LatLngTuple = [52.5468, 19.7064]

export function PlanTrailMap({
  stops,
  route,
  routeLoading,
  selectedKey,
  onSelectStop,
  mapKey = 'default',
}: PlanTrailMapProps) {
  const stopPositions: LatLngTuple[] = stops.map((stop) => [stop.lat, stop.lon])
  const pathPositions =
    route && route.positions.length >= 2 ? route.positions : stopPositions
  const center: LatLngTuple = stopPositions[0] ?? DEFAULT_CENTER
  const showPath = pathPositions.length >= 2
  const deferMapMount = routeLoading && stops.length >= 2

  if (deferMapMount) {
    return <PlanMapLoadingPlaceholder />
  }

  return (
    <Card className={appLayout.cardShell}>
      <div className={cn('relative bg-muted', appLayout.mapFrame)}>
        <MapContainer
          key={mapKey}
          center={center}
          zoom={13}
          className="h-full w-full z-0"
          scrollWheelZoom={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitTrailBounds
            positions={showPath ? pathPositions : stopPositions.length > 0 ? stopPositions : [center]}
          />
          {showPath ? (
            <Polyline
              positions={pathPositions}
              pathOptions={{
                color: '#0b3d91',
                weight: 5,
                opacity: route?.followsRoads ? 0.9 : 0.45,
                dashArray: route?.followsRoads ? undefined : '8 10',
              }}
            />
          ) : null}
          {stops.map((stop) => (
            <Marker
              key={stop.key}
              position={[stop.lat, stop.lon]}
              icon={stopIcon(stop.order, stop.key === selectedKey)}
              eventHandlers={{
                click: () => onSelectStop(stop.key),
              }}
            />
          ))}
        </MapContainer>
      </div>
    </Card>
  )
}
