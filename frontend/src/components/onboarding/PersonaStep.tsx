import { Home, MapPin } from 'lucide-react'

import { OnboardingActionBar } from '@/components/onboarding/OnboardingActionBar'
import { OnboardingStepHeading } from '@/components/onboarding/OnboardingStepHeading'
import { onboardingPrimaryButtonClass } from '@/components/onboarding/onboardingButtonStyles'
import { Button } from '@/components/ui/button'
import type { Persona } from '@/types/userContext'
import { cn } from '@/lib/utils'

const INTRO =
  'Wybierz to, co najlepiej Cię opisuje — dopasujemy plany i propozycje do Twojej sytuacji.'

const PERSONA_CARD_CLASS =
  'grid w-full grid-cols-[2.5rem_1fr] items-center gap-3 rounded-xl border p-3.5 text-left shadow-sm transition-colors'

const PERSONA_ICON_WRAP =
  'flex size-10 items-center justify-center rounded-full bg-primary/10'

const PERSONA_ICON_CLASS = 'size-[1.125rem] shrink-0 text-primary'

type PersonaOptionProps = {
  selected: boolean
  onSelect: () => void
  icon: typeof Home
  title: string
  description: string
}

function PersonaOption({
  selected,
  onSelect,
  icon: Icon,
  title,
  description,
}: PersonaOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        PERSONA_CARD_CLASS,
        selected
          ? 'border-primary bg-secondary ring-1 ring-primary/20'
          : 'border-border/80 bg-card hover:border-primary/40',
      )}
    >
      <span className={PERSONA_ICON_WRAP}>
        <Icon className={PERSONA_ICON_CLASS} strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="font-heading block text-[0.9375rem] leading-tight font-bold whitespace-nowrap">
          {title}
        </span>
        <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  )
}

type PersonaStepProps = {
  value: Persona | null
  onChange: (persona: Persona) => void
}

export function PersonaStep({ value, onChange }: PersonaStepProps) {
  return (
    <>
      <OnboardingStepHeading>{INTRO}</OnboardingStepHeading>
      <div className="flex flex-col gap-3">
        <PersonaOption
          selected={value === 'resident'}
          onSelect={() => onChange('resident')}
          icon={Home}
          title="Mieszkaniec"
          description="Szukam pomysłów na co dzień"
        />
        <PersonaOption
          selected={value === 'tourist'}
          onSelect={() => onChange('tourist')}
          icon={MapPin}
          title="Turysta"
          description="Odkrywam okolicę, trasy i atrakcje"
        />
      </div>
    </>
  )
}

export function PersonaStepActions({
  value,
  onNext,
}: {
  value: Persona | null
  onNext: () => void
}) {
  return (
    <OnboardingActionBar>
      <Button
        type="button"
        className={onboardingPrimaryButtonClass}
        size="default"
        disabled={!value}
        onClick={onNext}
      >
        Dalej
      </Button>
    </OnboardingActionBar>
  )
}
