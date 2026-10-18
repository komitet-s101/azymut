import type { ReactNode } from 'react'

import { OnboardingPageHeader } from '@/components/onboarding/OnboardingPageHeader'
import { OnboardingPrivacyFooter } from '@/components/onboarding/OnboardingPrivacyFooter'
import { WavePageHeader } from '@/components/layout/WavePageHeader'
import { Badge } from '@/components/ui/badge'
import { appLayout } from '@/lib/appLayout'
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
        <div className={appLayout.onboardingScroll}>
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
              className={appLayout.onboardingFooter}
            >
              {footerActions}
            </div>
          ) : null}
          <div
            className={appLayout.onboardingPrivacy}
          >
            <OnboardingPrivacyFooter />
          </div>
        </div>
      </div>
    </div>
  )
}
