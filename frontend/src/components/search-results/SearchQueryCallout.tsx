type SearchQueryCalloutProps = {
  query: string
}

export function SearchQueryCallout({ query }: SearchQueryCalloutProps) {
  const trimmed = query.trim()
  if (!trimmed) {
    return null
  }

  return (
    <figure className="rounded-xl border border-primary/20 bg-white px-3 py-2.5 shadow-sm ring-1 ring-primary/5">
      <figcaption className="text-[0.6875rem] font-semibold uppercase tracking-wide text-primary/80">
        Twoje zapytanie
      </figcaption>
      <blockquote className="mt-1 font-heading text-base font-semibold leading-snug text-foreground">
        „{trimmed}”
      </blockquote>
    </figure>
  )
}
