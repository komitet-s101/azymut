import { Loader2, Map } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { appLayout } from '@/lib/appLayout'
import { cn } from '@/lib/utils'

type PlanMapLoadingPlaceholderProps = {
  message?: string
}

export function PlanMapLoadingPlaceholder({
  message = 'Wyznaczamy trasę po drogach…',
}: PlanMapLoadingPlaceholderProps) {
  return (
    <Card className={appLayout.cardShell}>
      <div
        className={cn(appLayout.mapFrame, appLayout.mapLoadingCenter)}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-primary/5 to-transparent" />
        <div className={cn('relative', appLayout.mapLoadingIconWrap)}>
          <Map className={appLayout.mapLoadingMapIcon} aria-hidden />
          <Loader2 className={appLayout.mapLoadingSpinner} aria-hidden />
        </div>
        <p className="relative text-center text-sm font-medium text-foreground">{message}</p>
      </div>
    </Card>
  )
}
