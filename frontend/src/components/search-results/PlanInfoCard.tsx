import type { LucideIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { appLayout } from '@/lib/appLayout'

type PlanInfoCardProps = {
  icon: LucideIcon
  children: string
}

export function PlanInfoCard({ icon: Icon, children }: PlanInfoCardProps) {
  return (
    <Card className={appLayout.infoCard}>
      <span className={appLayout.infoCardIconWrap}>
        <Icon className={appLayout.infoCardIcon} aria-hidden />
      </span>
      <p className={appLayout.infoCardText}>{children}</p>
    </Card>
  )
}
