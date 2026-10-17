import type { UserContextLocal } from '@/types/userContext'

const STORAGE_KEY = 'azymut_user_context_v1'

export function loadUserContext(): UserContextLocal | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    return JSON.parse(raw) as UserContextLocal
  } catch {
    return null
  }
}

export function saveUserContext(context: UserContextLocal): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(context))
}

export function isOnboardingComplete(): boolean {
  const ctx = loadUserContext()
  return Boolean(ctx?.onboarding_completed_at && ctx.persona)
}

export function clearUserContext(): void {
  localStorage.removeItem(STORAGE_KEY)
}
