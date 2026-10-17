import type { ReactNode } from 'react'

import { OnboardingPageHeader } from '@/components/onboarding/OnboardingPageHeader'
import { OnboardingPrivacyFooter } from '@/components/onboarding/OnboardingPrivacyFooter'
import { WavePageHeader } from '@/components/layout/WavePageHeader'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type OnboardingLayoutProps = {
  children: ReactNode
  footerActions?: ReactNode
  step: number
  totalSteps: number
  className?: string
}

export function OnboardingLayout({
  children,
  footerActions,
  step,
  totalSteps,
  className,
}: OnboardingLayoutProps) {
  return (
    <div className="onboarding-root flex min-h-full max-h-full flex-col overflow-hidden">
      <WavePageHeader
        header={<OnboardingPageHeader />}
        className="pb-12"
        contentClassName="pt-[max(2.75rem,calc(env(safe-area-inset-top)+1.25rem))]"
      />
      <div
        className={cn(
          'home-surface-texture flex min-h-0 flex-1 flex-col',
          className,
        )}
      >
        <div className="scrollbar-hidden flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-6 pb-8">
          <div className="mb-5 flex justify-center">
            <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
              Krok {step} z {totalSteps}
            </Badge>
          </div>
          {children}
        </div>

        <div className="mt-auto flex shrink-0 flex-col bg-background">
          {footerActions ? (
            <div
              className="flex min-h-[6.5rem] flex-col justify-end bg-background/95 px-6 pt-4 pb-1 backdrop-blur-sm"
            >
              {footerActions}
            </div>
          ) : null}
          <div
            className="shrink-0 px-6 pt-5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))]"
          >
            <OnboardingPrivacyFooter />
          </div>
        </div>
      </div>
    </div>
  )
}
