import { Building2, Map } from 'lucide-react'

import { OnboardingActionBar } from '@/components/onboarding/OnboardingActionBar'
import { OnboardingStepHeading } from '@/components/onboarding/OnboardingStepHeading'
import {
  onboardingPrimaryButtonClass,
  onboardingSecondaryButtonClass,
} from '@/components/onboarding/onboardingButtonStyles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { appLayout } from '@/lib/appLayout'
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
        appLayout.choiceCard,
        'flex w-full items-start gap-3',
        active ? appLayout.choiceCardActive : appLayout.choiceCardIdle,
      )}
    >
      <span
        className={cn(
          appLayout.choiceIconWrap,
          active ? appLayout.choiceIconWrapActive : appLayout.choiceIconWrapIdle,
        )}
        aria-hidden
      >
        <Icon className={appLayout.choiceIcon} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="font-medium text-foreground">{title}</span>
        <span className={appLayout.bodyMuted}>{description}</span>
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
      <div className={appLayout.sectionStack}>
        <label className={appLayout.fieldLabel}>
          Wiek
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={120}
            placeholder="np. 18"
            value={age}
            onChange={(e) => onAgeChange(e.target.value)}
            className={appLayout.inputField}
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
                appLayout.toggleRow,
                hasChildren ? appLayout.choiceCardActive : appLayout.choiceCardIdle,
              )}
            >
              <span>Mam dzieci</span>
              <span className="text-muted-foreground">{hasChildren ? 'Tak' : 'Nie'}</span>
            </button>
            {hasChildren ? (
              <label className={appLayout.fieldLabel}>
                Liczba dzieci
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={12}
                  placeholder="np. 2"
                  value={childrenCount}
                  onChange={(e) => onChildrenCountChange(e.target.value)}
                  className={appLayout.inputField}
                />
              </label>
            ) : null}
          </>
        ) : null}

        {persona === 'tourist' ? (
          <div className={appLayout.listStack}>
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
            appLayout.toggleRow,
            preferOutdoor ? appLayout.choiceCardActive : appLayout.choiceCardIdle,
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
