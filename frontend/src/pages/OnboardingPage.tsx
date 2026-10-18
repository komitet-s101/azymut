import { useState, type Dispatch, type SetStateAction } from 'react'

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
import {
  SuggestedRoutesStep,
  SuggestedRoutesStepActions,
} from '@/components/onboarding/SuggestedRoutesStep'
import { CUSTOM_INTEREST_ID } from '@/data/interestCategories'
import {
  buildUserContextFromOnboarding,
  onboardingFormFromUserContext,
  type OnboardingFormState,
} from '@/lib/buildUserContextFromOnboarding'
import {
  onboardingStepId,
  onboardingStepNumber,
  onboardingTotalSteps,
} from '@/lib/onboardingFlow'
import { loadUserContext, saveUserContext } from '@/lib/userContextStorage'
import type { Persona } from '@/types/userContext'

export type OnboardingEntry = 'full' | 'edit-interests'

type OnboardingPageProps = {
  entry: OnboardingEntry
  onComplete: () => void
  onCancel?: () => void
}

function useOnboardingField<T>(
  seeded: OnboardingFormState | null,
  pick: (form: OnboardingFormState) => T,
  fallback: T,
): [T, Dispatch<SetStateAction<T>>] {
  return useState<T>(() => (seeded ? pick(seeded) : fallback))
}

export function OnboardingPage({ entry, onComplete, onCancel }: OnboardingPageProps) {
  const storedContext = entry === 'edit-interests' ? loadUserContext() : null
  const seededForm = storedContext ? onboardingFormFromUserContext(storedContext) : null
  const isEditInterests = entry === 'edit-interests' && seededForm !== null

  const [step, setStep] = useState(() => {
    if (isEditInterests && seededForm?.persona) {
      return onboardingStepNumber(seededForm.persona, 'interests')
    }
    return 1
  })
  const [persona, setPersona] = useOnboardingField(seededForm, (form) => form.persona, null)
  const [interestTagIds, setInterestTagIds] = useOnboardingField(
    seededForm,
    (form) => form.interestTagIds,
    [],
  )
  const [selectedRouteId, setSelectedRouteId] = useOnboardingField(
    seededForm,
    (form) => form.selectedRouteId,
    null,
  )
  const [age, setAge] = useOnboardingField(seededForm, (form) => form.age, '')
  const [hasChildren, setHasChildren] = useOnboardingField(
    seededForm,
    (form) => form.hasChildren,
    false,
  )
  const [childrenCount, setChildrenCount] = useOnboardingField(
    seededForm,
    (form) => form.childrenCount,
    '',
  )
  const [customInterests, setCustomInterests] = useOnboardingField(
    seededForm,
    (form) => form.customInterests,
    '',
  )
  const [preferOutdoor, setPreferOutdoor] = useOnboardingField(
    seededForm,
    (form) => form.preferOutdoor,
    true,
  )
  const [touristGeographyScope, setTouristGeographyScope] = useOnboardingField(
    seededForm,
    (form) => form.touristGeographyScope,
    'plock_city',
  )

  const totalSteps = onboardingTotalSteps(persona)
  const stepId = onboardingStepId(persona, step)

  function handlePersonaChange(value: Persona) {
    if (value !== persona) {
      setSelectedRouteId(null)
      if (value === 'resident' && step > 3) {
        setStep(3)
      }
    }
    setPersona(value)
  }

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
      setSelectedRouteId(null)
      return
    }
    setInterestTagIds((prev) => [...prev, id])
    setSelectedRouteId(null)
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
      selectedRouteId,
      touristGeographyScope,
    }
    const context = buildUserContextFromOnboarding(form)
    if (!context) {
      return
    }
    const previous = loadUserContext()
    if (previous?.last_plan_id) {
      context.last_plan_id = previous.last_plan_id
    }
    saveUserContext(context)
    onComplete()
  }

  function goBack() {
    setStep((prev) => Math.max(1, prev - 1))
  }

  function goNext() {
    setStep((prev) => Math.min(totalSteps, prev + 1))
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
  if (stepId === 'persona') {
    footerActions = <PersonaStepActions value={persona} onNext={goNext} />
  } else if (stepId === 'interests') {
    footerActions = (
      <InterestsStepActions
        selectedIds={interestTagIds}
        onBack={isEditInterests ? () => onCancel?.() : goBack}
        onNext={isEditInterests ? handleFinish : goNext}
        backLabel={isEditInterests ? 'Anuluj' : undefined}
        nextLabel={isEditInterests ? 'Zapisz' : undefined}
      />
    )
  } else if (stepId === 'routes') {
    footerActions = (
      <SuggestedRoutesStepActions onBack={goBack} onNext={handleFinish} />
    )
  } else if (stepId === 'profile') {
    const profileIsLastStep = step >= totalSteps
    footerActions = (
      <ProfileStepActions
        canFinish={canFinish}
        onBack={goBack}
        onPrimary={profileIsLastStep ? handleFinish : goNext}
        primaryLabel={
          profileIsLastStep ? 'Zakończ i przejdź do aplikacji' : 'Dalej'
        }
      />
    )
  }

  return (
    <OnboardingLayout
      step={step}
      totalSteps={totalSteps}
      stepBadgeLabel={isEditInterests ? 'Zmiana zainteresowań' : undefined}
      footerActions={footerActions}
    >
      {stepId === 'persona' ? (
        <PersonaStep value={persona} onChange={handlePersonaChange} />
      ) : null}
      {stepId === 'interests' ? (
        <InterestsStep
          selectedIds={interestTagIds}
          customInterests={customInterests}
          onToggle={toggleInterest}
          onCustomInterestsChange={setCustomInterests}
        />
      ) : null}
      {stepId === 'routes' ? (
        <SuggestedRoutesStep
          interestTagIds={interestTagIds}
          geographyScope={touristGeographyScope}
          selectedRouteId={selectedRouteId}
          onSelectRoute={setSelectedRouteId}
        />
      ) : null}
      {stepId === 'profile' ? (
        <ProfileStep
          persona={persona}
          age={age}
          hasChildren={hasChildren}
          childrenCount={childrenCount}
          preferOutdoor={preferOutdoor}
          touristGeographyScope={touristGeographyScope}
          onAgeChange={handleAgeChange}
          onHasChildrenChange={handleHasChildrenChange}
          onChildrenCountChange={setChildrenCount}
          onPreferOutdoorChange={setPreferOutdoor}
          onTouristGeographyScopeChange={(scope) => {
            setTouristGeographyScope(scope)
            setSelectedRouteId(null)
          }}
        />
      ) : null}
    </OnboardingLayout>
  )
}
