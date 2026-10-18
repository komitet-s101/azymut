import { Loader2, Map } from 'lucide-react'

import { Card } from '@/components/ui/card'

type PlanMapLoadingPlaceholderProps = {
  message?: string
}

export function PlanMapLoadingPlaceholder({
  message = 'Wyznaczamy trasę po drogach…',
}: PlanMapLoadingPlaceholderProps) {
  return (
    <Card className="gap-0 overflow-hidden border-border/80 py-0">
      <div
        className="relative flex h-[min(42vh,320px)] min-h-[220px] w-full flex-col items-center justify-center gap-3 bg-muted px-6"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative flex size-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-border/80">
          <Map className="size-6 text-primary/70" aria-hidden />
          <Loader2
            className="absolute -right-0.5 -bottom-0.5 size-5 animate-spin text-primary"
            aria-hidden
          />
        </div>
        <p className="relative text-center text-sm font-medium text-foreground">{message}</p>
      </div>
    </Card>
  )
}
