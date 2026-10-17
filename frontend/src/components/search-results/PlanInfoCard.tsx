import type { LucideIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'

type PlanInfoCardProps = {
  icon: LucideIcon
  children: string
}

export function PlanInfoCard({ icon: Icon, children }: PlanInfoCardProps) {
  return (
    <Card className="flex-row items-start gap-3 border-border/80 p-4 shadow-sm">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <Icon className="size-4 text-primary" aria-hidden />
      </span>
      <p className="text-left text-sm leading-relaxed text-foreground">{children}</p>
    </Card>
  )
}
