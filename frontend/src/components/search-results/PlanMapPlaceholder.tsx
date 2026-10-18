import { Map } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { appLayout } from '@/lib/appLayout'
import { cn } from '@/lib/utils'

type PlanMapPlaceholderProps = {
  label: string
}

export function PlanMapPlaceholder({ label }: PlanMapPlaceholderProps) {
  return (
    <Card className={appLayout.cardShell}>
      <div className={cn('relative bg-muted', appLayout.mapFrame)}>
        <Button
          type="button"
          variant="secondary"
          className="absolute top-1/2 left-1/2 h-auto -translate-x-1/2 -translate-y-1/2 gap-2 rounded-full px-5 py-2.5 shadow-md"
        >
          <Map className={appLayout.sectionIcon} aria-hidden />
          {label}
        </Button>
      </div>
    </Card>
  )
}
