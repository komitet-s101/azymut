import { Sparkles } from 'lucide-react'

const HEADER_TITLE = 'Twój namiar'
const HEADER_LEAD = 'Plan dopasowany do Twojego zapytania'

type PlanResultsHeaderProps = {
  query?: string
}

export function PlanResultsHeader({ query }: PlanResultsHeaderProps) {
  const trimmed = query?.trim()

  return (
    <header className="text-center text-primary-foreground">
      <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
        <Sparkles className="size-5 text-white" aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{HEADER_TITLE}</h1>
      <p className="mt-1.5 text-sm font-medium text-white/90">{HEADER_LEAD}</p>
      {trimmed ? (
        <p className="mt-2 line-clamp-2 px-2 text-sm text-white/75">„{trimmed}”</p>
      ) : null}
    </header>
  )
}
