import { InterestOptionCard } from '@/components/onboarding/InterestOptionCard'
import { OnboardingActionBar } from '@/components/onboarding/OnboardingActionBar'
import { OnboardingStepHeading } from '@/components/onboarding/OnboardingStepHeading'
import {
  onboardingPrimaryButtonClass,
  onboardingSecondaryButtonClass,
} from '@/components/onboarding/onboardingButtonStyles'
import { Button } from '@/components/ui/button'
import { onboardingInterestOptions } from '@/data/interestCategories'

const INTRO = 'Wybierz zainteresowania — kilka opcji naraz.'

type InterestsStepProps = {
  selectedIds: string[]
  onToggle: (id: string) => void
}

export function InterestsStep({ selectedIds, onToggle }: InterestsStepProps) {
  const options = onboardingInterestOptions()

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
