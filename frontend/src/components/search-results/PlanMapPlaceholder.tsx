import { Map } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type PlanMapPlaceholderProps = {
  label: string
}

export function PlanMapPlaceholder({ label }: PlanMapPlaceholderProps) {
  return (
    <Card className="gap-0 overflow-hidden border-border/80 py-0">
      <div className="relative aspect-[16/9] w-full bg-muted">
        <Button
          type="button"
          variant="secondary"
          className="absolute top-1/2 left-1/2 h-auto -translate-x-1/2 -translate-y-1/2 gap-2 rounded-full px-5 py-2.5 shadow-md"
        >
          <Map className="size-5 text-primary" aria-hidden />
          {label}
        </Button>
      </div>
    </Card>
  )
}
