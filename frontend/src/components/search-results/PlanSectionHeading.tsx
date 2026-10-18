import type { LucideIcon } from 'lucide-react'

import { appLayout } from '@/lib/appLayout'
import { cn } from '@/lib/utils'

type PlanSectionHeadingProps = {
  id?: string
  title: string
  icon?: LucideIcon
  className?: string
}

export function PlanSectionHeading({
  id,
  title,
  icon: Icon,
  className,
}: PlanSectionHeadingProps) {
  return (
    <h2 id={id} className={cn(appLayout.sectionTitle, className)}>
      {Icon ? <Icon className={appLayout.sectionIcon} aria-hidden /> : null}
      {title}
    </h2>
  )
}
