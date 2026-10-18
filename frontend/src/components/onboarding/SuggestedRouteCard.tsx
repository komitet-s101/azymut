import { RouteSummaryCard } from '@/components/search-results/RouteSummaryCard'
import type { RouteSummary } from '@/lib/routeApi'

type SuggestedRouteCardProps = {
  route: RouteSummary
  selected: boolean
  onSelect: () => void
}

export function SuggestedRouteCard({ route, selected, onSelect }: SuggestedRouteCardProps) {
  return (
    <RouteSummaryCard
      route={route}
      selected={selected}
      onSelect={onSelect}
    />
  )
}
