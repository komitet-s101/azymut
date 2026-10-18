import { useEffect, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type ScreenTransitionDirection = 'forward' | 'back'

type ScreenTransitionProps = {
  screenKey: string
  direction: ScreenTransitionDirection
  children: ReactNode
  /** Bez dolnego paddingu w ramce telefonu (onboarding). */
  flushBottom?: boolean
  className?: string
}

export function ScreenTransition({
  screenKey,
  direction,
  children,
  flushBottom = false,
  className,
}: ScreenTransitionProps) {
  useEffect(() => {
    const scrollRoot =
      document.querySelector<HTMLElement>('.screen-app-scroll') ??
      document.getElementById('main-content')
    scrollRoot?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [screenKey])

  return (
    <div
      key={screenKey}
      className={cn(
        'flex min-h-full flex-1 flex-col',
        flushBottom && 'azymut-screen-shell-flush',
        direction === 'forward' ? 'azymut-screen-enter-forward' : 'azymut-screen-enter-back',
        className,
      )}
    >
      {children}
    </div>
  )
}
