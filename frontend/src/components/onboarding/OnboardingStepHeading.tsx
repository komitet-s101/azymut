import { cn } from '@/lib/utils'

type OnboardingStepHeadingProps = {
  children: string
  className?: string
}

export function OnboardingStepHeading({ children, className }: OnboardingStepHeadingProps) {
  return (
    <h2
      className={cn(
        'font-heading mb-5 text-lg font-semibold leading-snug text-foreground',
        className,
      )}
    >
      {children}
    </h2>
  )
}
