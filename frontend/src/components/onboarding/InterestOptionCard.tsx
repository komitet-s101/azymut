import { Check } from 'lucide-react'

import type { OnboardingInterestOption } from '@/data/interestCategories'
import { cn } from '@/lib/utils'

type InterestOptionCardProps = {
  option: OnboardingInterestOption
  active: boolean
  onToggle: () => void
}

export function InterestOptionCard({ option, active, onToggle }: InterestOptionCardProps) {
  const Icon = option.icon

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors',
        active
          ? 'border-primary bg-primary/10 shadow-sm'
          : 'border-border/70 bg-card hover:border-border',
      )}
    >
      <span
        className={cn(
          'flex size-[1.125rem] shrink-0 items-center justify-center rounded border',
          active ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/35 bg-background',
        )}
        aria-hidden
      >
        {active ? <Check className="size-3" strokeWidth={3} /> : null}
      </span>
      <Icon
        className={cn(
          'size-4 shrink-0',
          active ? 'text-primary' : 'text-muted-foreground',
        )}
        strokeWidth={2}
        aria-hidden
      />
      <span
        className={cn(
          'min-w-0 flex-1 text-sm leading-snug',
          active ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground',
        )}
      >
        {option.label}
      </span>
    </button>
  )
}
