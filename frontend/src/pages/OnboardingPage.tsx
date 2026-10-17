import { useState } from 'react'

import {
  InterestsStep,
  InterestsStepActions,
} from '@/components/onboarding/InterestsStep'
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout'
import {
  PersonaStep,
  PersonaStepActions,
} from '@/components/onboarding/PersonaStep'
import {
  ProfileStep,
  ProfileStepActions,
} from '@/components/onboarding/ProfileStep'
import { CUSTOM_INTEREST_ID } from '@/data/interestCategories'
import {
  buildUserContextFromOnboarding,
  type OnboardingFormState,
} from '@/lib/buildUserContextFromOnboarding'
import { saveUserContext } from '@/lib/userContextStorage'
import type { Persona } from '@/types/userContext'

const TOTAL_STEPS = 3

type OnboardingPageProps = {
  onComplete: () => void
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [step, setStep] = useState(1)
  const [persona, setPersona] = useState<Persona | null>(null)
  const [interestTagIds, setInterestTagIds] = useState<string[]>([])
  const [age, setAge] = useState('')
  const [hasChildren, setHasChildren] = useState(false)
  const [childrenCount, setChildrenCount] = useState('')
  const [customInterests, setCustomInterests] = useState('')
  const [preferOutdoor, setPreferOutdoor] = useState(true)

  function handleAgeChange(value: string) {
    setAge(value)
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed) && parsed < 18) {
      setHasChildren(false)
      setChildrenCount('')
    }
  }

  function handleHasChildrenChange(value: boolean) {
    setHasChildren(value)
    if (value) {
      setChildrenCount((prev) => (prev.trim() === '' ? '1' : prev))
    } else {
      setChildrenCount('')
    }
  }

  function toggleInterest(id: string) {
    if (interestTagIds.includes(id)) {
      if (id === CUSTOM_INTEREST_ID) {
        setCustomInterests('')
      }
      setInterestTagIds((prev) => prev.filter((item) => item !== id))
      return
    }
    setInterestTagIds((prev) => [...prev, id])
  }

  function handleFinish() {
    const form: OnboardingFormState = {
      persona,
      interestTagIds,
      age,
      hasChildren,
      childrenCount,
      customInterests,
      preferOutdoor,
    }
    const context = buildUserContextFromOnboarding(form)
    if (!context) {
      return
    }
    saveUserContext(context)
    onComplete()
  }

  const ageParsed = Number.parseInt(age, 10)
  const ageValid = age.trim() !== '' && Number.isFinite(ageParsed) && ageParsed > 0
  const needsChildrenCount = ageValid && ageParsed >= 18 && hasChildren
  const childrenCountParsed = Number.parseInt(childrenCount, 10)
  const childrenCountValid =
    !needsChildrenCount ||
    (Number.isFinite(childrenCountParsed) && childrenCountParsed >= 1)
  const canFinish =
    ageValid && childrenCountValid && interestTagIds.length > 0 && persona !== null

  let footerActions = null
  if (step === 1) {
    footerActions = <PersonaStepActions value={persona} onNext={() => setStep(2)} />
  } else if (step === 2) {
    footerActions = (
      <InterestsStepActions
        selectedIds={interestTagIds}
        onBack={() => setStep(1)}
        onNext={() => setStep(3)}
      />
    )
  } else if (step === 3) {
    footerActions = (
      <ProfileStepActions
        canFinish={canFinish}
        onBack={() => setStep(2)}
        onFinish={handleFinish}
      />
    )
  }

  return (
    <OnboardingLayout step={step} totalSteps={TOTAL_STEPS} footerActions={footerActions}>
      {step === 1 ? (
        <PersonaStep value={persona} onChange={setPersona} />
      ) : null}
      {step === 2 ? (
        <InterestsStep
          selectedIds={interestTagIds}
          customInterests={customInterests}
          onToggle={toggleInterest}
          onCustomInterestsChange={setCustomInterests}
        />
      ) : null}
      {step === 3 ? (
        <ProfileStep
          age={age}
          hasChildren={hasChildren}
          childrenCount={childrenCount}
          preferOutdoor={preferOutdoor}
          onAgeChange={handleAgeChange}
          onHasChildrenChange={handleHasChildrenChange}
          onChildrenCountChange={setChildrenCount}
          onPreferOutdoorChange={setPreferOutdoor}
        />
      ) : null}
    </OnboardingLayout>
  )
}
