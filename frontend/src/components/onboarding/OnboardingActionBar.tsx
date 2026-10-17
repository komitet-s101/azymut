import type { ReactNode } from 'react'

type OnboardingActionBarProps = {
  children: ReactNode
}

export function OnboardingActionBar({ children }: OnboardingActionBarProps) {
  return <div className="flex w-full flex-col gap-3">{children}</div>
}
