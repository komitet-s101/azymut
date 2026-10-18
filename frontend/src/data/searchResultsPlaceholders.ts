import type { UpcomingEventPlaceholder } from '@/data/homePlaceholders'

export type SearchResultsPlaceholder = {
  planSummary: string
  mapLabel: string
  ticketInfo: string
  weatherInfo: string
  relatedSectionTitle: string
  related: UpcomingEventPlaceholder
}

export const DEFAULT_SEARCH_RESULTS: SearchResultsPlaceholder = {
  planSummary: 'Plan na 3‑godzinne zwiedzanie',
  mapLabel: 'Pokaż na mapie',
  ticketInfo: 'Ceny biletów lub brak, jeżeli darmowe',
  weatherInfo: 'Pogoda i inne warunki na dziś',
  relatedSectionTitle: 'Również może Cię zainteresować',
  related: {
    id: 'sug-1',
    title: 'Festiwal nad rzeką',
    dateLabel: 'Niedziela, 19 paź · 16:00',
    category: 'Muzyka',
    locationLabel: 'Płock',
  },
}
