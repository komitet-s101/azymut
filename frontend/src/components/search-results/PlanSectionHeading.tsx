import type { LucideIcon } from 'lucide-react'
import { Lightbulb } from 'lucide-react'

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
  icon: Icon = Lightbulb,
  className,
}: PlanSectionHeadingProps) {
  return (
    <h2
      id={id}
      className={cn('flex items-center gap-2 text-lg font-semibold text-foreground', className)}
    >
      <Icon className="size-5 shrink-0 text-primary" aria-hidden />
      {title}
    </h2>
  )
}
