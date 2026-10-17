import { OnboardingActionBar } from '@/components/onboarding/OnboardingActionBar'
import { OnboardingStepHeading } from '@/components/onboarding/OnboardingStepHeading'
import {
  onboardingPrimaryButtonClass,
  onboardingSecondaryButtonClass,
} from '@/components/onboarding/onboardingButtonStyles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

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
  age: string
  hasChildren: boolean
  childrenCount: string
  preferOutdoor: boolean
  onAgeChange: (value: string) => void
  onHasChildrenChange: (value: boolean) => void
  onChildrenCountChange: (value: string) => void
  onPreferOutdoorChange: (value: boolean) => void
}

export function ProfileStep({
  age,
  hasChildren,
  childrenCount,
  preferOutdoor,
  onAgeChange,
  onHasChildrenChange,
  onChildrenCountChange,
  onPreferOutdoorChange,
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
  onFinish,
}: {
  canFinish: boolean
  onBack: () => void
  onFinish: () => void
}) {
  return (
    <OnboardingActionBar>
      <Button
        type="button"
        className={onboardingPrimaryButtonClass}
        size="default"
        disabled={!canFinish}
        onClick={onFinish}
      >
        Zakończ i przejdź do aplikacji
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
