import { Building2, Map } from 'lucide-react'

import { OnboardingActionBar } from '@/components/onboarding/OnboardingActionBar'
import { OnboardingStepHeading } from '@/components/onboarding/OnboardingStepHeading'
import {
  onboardingPrimaryButtonClass,
  onboardingSecondaryButtonClass,
} from '@/components/onboarding/onboardingButtonStyles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Persona, TouristGeographyScope } from '@/types/userContext'

const INTRO = 'Podaj swój wiek — dopasujemy propozycje do Twojej sytuacji.'
const ADULT_AGE_THRESHOLD = 18

function parseAge(age: string): number | null {
  const parsed = Number.parseInt(age, 10)
  if (!Number.isFinite(parsed) || parsed < 1) {
    return null
  }
  return parsed
}

type ProfileStepProps = {
  persona: Persona | null
  age: string
  hasChildren: boolean
  childrenCount: string
  preferOutdoor: boolean
  touristGeographyScope: TouristGeographyScope
  onAgeChange: (value: string) => void
  onHasChildrenChange: (value: boolean) => void
  onChildrenCountChange: (value: string) => void
  onPreferOutdoorChange: (value: boolean) => void
  onTouristGeographyScopeChange: (value: TouristGeographyScope) => void
}

function GeographyOption({
  active,
  title,
  description,
  icon: Icon,
  onSelect,
}: {
  active: boolean
  title: string
  description: string
  icon: typeof Building2
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left text-sm shadow-sm transition-colors',
        active
          ? 'border-primary bg-secondary ring-1 ring-primary/20'
          : 'border-border/80 bg-card hover:border-border',
      )}
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
        )}
        aria-hidden
      >
        <Icon className="size-4" />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="font-medium text-foreground">{title}</span>
        <span className="text-xs leading-snug text-muted-foreground">{description}</span>
      </span>
    </button>
  )
}

export function ProfileStep({
  persona,
  age,
  hasChildren,
  childrenCount,
  preferOutdoor,
  touristGeographyScope,
  onAgeChange,
  onHasChildrenChange,
  onChildrenCountChange,
  onPreferOutdoorChange,
  onTouristGeographyScopeChange,
}: ProfileStepProps) {
  const ageValue = parseAge(age)
  const showChildrenQuestion = ageValue !== null && ageValue >= ADULT_AGE_THRESHOLD

  return (
    <>
      <OnboardingStepHeading>{INTRO}</OnboardingStepHeading>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
          Wiek
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={120}
            placeholder="np. 18"
            value={age}
            onChange={(e) => onAgeChange(e.target.value)}
            className="h-12 rounded-full border-border/80 bg-white px-4 shadow-sm"
          />
        </label>

        {showChildrenQuestion ? (
          <>
            <button
              type="button"
              role="switch"
              aria-checked={hasChildren}
              onClick={() => onHasChildrenChange(!hasChildren)}
              className={cn(
                'flex items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm shadow-sm',
                hasChildren
                  ? 'border-primary bg-secondary ring-1 ring-primary/20'
                  : 'border-border/80 bg-card',
              )}
            >
              <span>Mam dzieci</span>
              <span className="text-muted-foreground">{hasChildren ? 'Tak' : 'Nie'}</span>
            </button>
            {hasChildren ? (
              <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                Liczba dzieci
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={12}
                  placeholder="np. 2"
                  value={childrenCount}
                  onChange={(e) => onChildrenCountChange(e.target.value)}
                  className="h-12 rounded-full border-border/80 bg-white px-4 shadow-sm"
                />
              </label>
            ) : null}
          </>
        ) : null}

        {persona === 'tourist' ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Gdzie szukasz planów?</p>
            <GeographyOption
              active={touristGeographyScope === 'plock_city'}
              title="Tylko Płock"
              description="Spacery i jednodniówki w mieście"
              icon={Building2}
              onSelect={() => onTouristGeographyScopeChange('plock_city')}
            />
            <GeographyOption
              active={touristGeographyScope === 'plock_region'}
              title="Region płocki"
              description="Płock i okoliczne gminy"
              icon={Map}
              onSelect={() => onTouristGeographyScopeChange('plock_region')}
            />
          </div>
        ) : null}

        <button
          type="button"
          role="switch"
          aria-checked={preferOutdoor}
          onClick={() => onPreferOutdoorChange(!preferOutdoor)}
          className={cn(
            'flex items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm shadow-sm',
            preferOutdoor
              ? 'border-primary bg-secondary ring-1 ring-primary/20'
              : 'border-border/80 bg-card',
          )}
        >
          <span>Wolę aktywności na świeżym powietrzu</span>
          <span className="text-muted-foreground">{preferOutdoor ? 'Tak' : 'Nie'}</span>
        </button>
      </div>
    </>
  )
}

export function ProfileStepActions({
  canFinish,
  onBack,
  onPrimary,
  primaryLabel,
}: {
  canFinish: boolean
  onBack: () => void
  onPrimary: () => void
  primaryLabel: string
}) {
  return (
    <OnboardingActionBar>
      <Button
        type="button"
        className={onboardingPrimaryButtonClass}
        size="default"
        disabled={!canFinish}
        onClick={onPrimary}
      >
        {primaryLabel}
      </Button>
      <Button
        type="button"
        variant="outline"
        className={onboardingSecondaryButtonClass}
        size="default"
        onClick={onBack}
      >
        Wstecz
      </Button>
    </OnboardingActionBar>
  )
}
