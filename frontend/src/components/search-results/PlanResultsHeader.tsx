import { Sparkles } from 'lucide-react'

const HEADER_TITLE = 'Twój plan na dziś'

type PlanResultsHeaderProps = {
  planSummary: string
}

export function PlanResultsHeader({ planSummary }: PlanResultsHeaderProps) {
  return (
    <header className="text-center text-primary-foreground">
      <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
        <Sparkles className="size-5 text-white" aria-hidden />
      </div>
      <h1 className="font-heading text-2xl font-bold tracking-tight">{HEADER_TITLE}</h1>
      <p className="mt-1.5 px-3 font-heading text-sm font-normal leading-snug text-white/90">
        {planSummary}
      </p>
    </header>
  )
}
