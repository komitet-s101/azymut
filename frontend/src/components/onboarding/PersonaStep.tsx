import { Home, MapPin } from 'lucide-react'

import { OnboardingActionBar } from '@/components/onboarding/OnboardingActionBar'
import { OnboardingStepHeading } from '@/components/onboarding/OnboardingStepHeading'
import { onboardingPrimaryButtonClass } from '@/components/onboarding/onboardingButtonStyles'
import { Button } from '@/components/ui/button'
import { appLayout } from '@/lib/appLayout'
import { cn } from '@/lib/utils'
import type { Persona } from '@/types/userContext'

const INTRO =
  'Wybierz to, co najlepiej Cię opisuje — dopasujemy plany i propozycje do Twojej sytuacji.'

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
        appLayout.choiceCard,
        appLayout.personaCard,
        selected ? appLayout.choiceCardActive : cn(appLayout.choiceCardIdle, 'hover:border-primary/40'),
      )}
    >
      <span className={cn(appLayout.personaIconWrap, 'text-primary')}>
        <Icon className={appLayout.choiceIcon} strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="font-heading block text-base font-semibold leading-snug whitespace-nowrap">
          {title}
        </span>
        <span className={cn('mt-0.5 block', appLayout.bodyMuted)}>{description}</span>
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
      <div className={appLayout.listStack}>
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
