import { appLayout } from '@/lib/appLayout'

type SearchQueryCalloutProps = {
  query: string
}

export function SearchQueryCallout({ query }: SearchQueryCalloutProps) {
  const trimmed = query.trim()
  if (!trimmed) {
    return null
  }

  return (
    <figure className={appLayout.callout}>
      <figcaption className={appLayout.calloutLabel}>Twoje zapytanie</figcaption>
      <blockquote className={appLayout.calloutBody}>„{trimmed}”</blockquote>
    </figure>
  )
}
