import { InterestOptionCard } from '@/components/onboarding/InterestOptionCard'
import { OnboardingActionBar } from '@/components/onboarding/OnboardingActionBar'
import { OnboardingStepHeading } from '@/components/onboarding/OnboardingStepHeading'
import {
  onboardingPrimaryButtonClass,
  onboardingSecondaryButtonClass,
} from '@/components/onboarding/onboardingButtonStyles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  CUSTOM_INTEREST_ID,
  onboardingInterestOptions,
} from '@/data/interestCategories'

const INTRO = 'Wybierz zainteresowania — kilka opcji naraz.'

type InterestsStepProps = {
  selectedIds: string[]
  customInterests: string
  onToggle: (id: string) => void
  onCustomInterestsChange: (value: string) => void
}

export function InterestsStep({
  selectedIds,
  customInterests,
  onToggle,
  onCustomInterestsChange,
}: InterestsStepProps) {
  const options = onboardingInterestOptions()
  const showCustomInput = selectedIds.includes(CUSTOM_INTEREST_ID)

  return (
    <>
      <OnboardingStepHeading>{INTRO}</OnboardingStepHeading>
      <div className="flex flex-col gap-1.5">
        {options.map((option) => (
          <InterestOptionCard
            key={option.id}
            option={option}
            active={selectedIds.includes(option.id)}
            onToggle={() => onToggle(option.id)}
          />
        ))}
      </div>
      {showCustomInput ? (
        <label className="mt-3 flex flex-col gap-2 text-sm font-medium text-foreground">
          Twoje zainteresowania
          <Input
            type="text"
            placeholder="np. ceramika, koncerty na dworze…"
            value={customInterests}
            onChange={(e) => onCustomInterestsChange(e.target.value)}
            className="h-12 rounded-full border-border/80 bg-white px-4 shadow-sm"
          />
        </label>
      ) : null}
    </>
  )
}

export function InterestsStepActions({
  selectedIds,
  onBack,
  onNext,
}: {
  selectedIds: string[]
  onBack: () => void
  onNext: () => void
}) {
  return (
    <OnboardingActionBar>
      <Button
        type="button"
        className={onboardingPrimaryButtonClass}
        size="default"
        disabled={selectedIds.length === 0}
        onClick={onNext}
      >
        Dalej
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
