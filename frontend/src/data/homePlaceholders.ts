export type UpcomingEventPlaceholder = {
  id: string
  title: string
  dateLabel: string
  category: string
  locationLabel: string
}

export const STATIC_UPCOMING_EVENTS: UpcomingEventPlaceholder[] = [
  {
    id: 'evt-1',
    title: 'Koncert na Rynku',
    dateLabel: 'Sobota, 18 paź · 10:00',
    category: 'Muzyka',
    locationLabel: 'Płock',
  },
  {
    id: 'evt-2',
    title: 'Spektakl w teatrze',
    dateLabel: 'Niedziela, 19 paź · 14:30',
    category: 'Teatr',
    locationLabel: 'Płock',
  },
  {
    id: 'evt-3',
    title: 'Wystawa w muzeum',
    dateLabel: 'Piątek, 24 paź · 18:00',
    category: 'Kultura',
    locationLabel: 'Płock',
  },
]
