import { Tag } from 'lucide-react'

import { categoryLabel } from '@/lib/searchApi'
import { cn } from '@/lib/utils'

type PlanCategoryBadgeProps = {
  category: string
  className?: string
}

export function PlanCategoryBadge({ category, className }: PlanCategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex w-fit max-w-full items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium leading-tight text-primary',
        className,
      )}
    >
      <Tag className="size-3 shrink-0 text-primary/85" aria-hidden />
      <span>{categoryLabel(category)}</span>
    </span>
  )
}
