import { appLayout } from '@/lib/appLayout'
import { cn } from '@/lib/utils'

type OnboardingStepHeadingProps = {
  children: string
  className?: string
}

export function OnboardingStepHeading({ children, className }: OnboardingStepHeadingProps) {
  return <h2 className={cn(appLayout.stepIntro, className)}>{children}</h2>
}
