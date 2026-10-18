import type { Persona } from '@/types/userContext'

export type OnboardingStepId = 'persona' | 'interests' | 'routes' | 'profile'

export function onboardingTotalSteps(persona: Persona | null): number {
  return persona === 'tourist' ? 4 : 3
}

export function onboardingStepNumber(
  persona: Persona | null,
  stepId: OnboardingStepId,
): number {
  if (persona === 'tourist') {
    switch (stepId) {
      case 'persona':
        return 1
      case 'interests':
        return 2
      case 'profile':
        return 3
      case 'routes':
        return 4
      default: {
        const unreachable: never = stepId
        return unreachable
      }
    }
  }
  switch (stepId) {
    case 'persona':
      return 1
    case 'interests':
      return 2
    case 'profile':
      return 3
    case 'routes':
      return 3
    default: {
      const unreachable: never = stepId
      return unreachable
    }
  }
}

export function onboardingStepId(persona: Persona | null, step: number): OnboardingStepId {
  if (persona === 'tourist') {
    switch (step) {
      case 1:
        return 'persona'
      case 2:
        return 'interests'
      case 3:
        return 'profile'
      case 4:
        return 'routes'
      default:
        return 'persona'
    }
  }
  switch (step) {
    case 1:
      return 'persona'
    case 2:
      return 'interests'
    case 3:
      return 'profile'
    default:
      return 'persona'
  }
}
