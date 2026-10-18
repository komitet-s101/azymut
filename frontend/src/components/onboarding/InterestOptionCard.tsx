import { Check } from 'lucide-react'

import type { OnboardingInterestOption } from '@/data/interestCategories'
import { appLayout } from '@/lib/appLayout'
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
        appLayout.choiceCard,
        'flex w-full items-center gap-3',
        active
          ? 'border-primary bg-primary/10 ring-1 ring-primary/15'
          : cn(appLayout.choiceCardIdle, 'hover:border-border'),
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
        className={cn(appLayout.metaIcon, active ? 'text-primary' : 'text-muted-foreground')}
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
