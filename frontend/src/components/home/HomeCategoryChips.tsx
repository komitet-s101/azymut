import { Badge } from '@/components/ui/badge'
import { selectedInterestLabels } from '@/lib/homePersonalization'
import { loadUserContext } from '@/lib/userContextStorage'
import { cn } from '@/lib/utils'

type HomeCategoryChipsProps = {
  className?: string
}

export function HomeCategoryChips({ className }: HomeCategoryChipsProps) {
  const labels = selectedInterestLabels(loadUserContext())
  if (labels.length === 0) {
    return null
  }
  return (
    <div className={cn('flex flex-wrap gap-2', className)} aria-label="Twoje kategorie z onboardingu">
      {labels.map((label) => (
        <Badge key={label} variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
          {label}
        </Badge>
      ))}
    </div>
  )
}
