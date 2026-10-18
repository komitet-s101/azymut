import type { ReactNode } from 'react'

import { AccessibilityToolbar } from '@/components/accessibility/AccessibilityToolbar'
import { SkipToContentLink } from '@/components/accessibility/SkipToContentLink'
import { Button } from '@/components/ui/button'
import { useShowDeviceMockFrame } from '@/lib/deviceMock'
import { cn } from '@/lib/utils'
import { clearUserContext } from '@/lib/userContextStorage'

type DeviceFrameProps = {
  children: ReactNode
  className?: string
  showBottomFade?: boolean
}

type AppShellContentProps = {
  children: ReactNode
  showBottomFade: boolean
  mainContentClassName: string
}

function AppShellContent({
  children,
  showBottomFade,
  mainContentClassName,
}: AppShellContentProps) {
  return (
    <>
      <SkipToContentLink />
      <AccessibilityToolbar />
      <div id="main-content" className={mainContentClassName} tabIndex={-1}>
        {children}
      </div>
      {showBottomFade ? <div className="screen-app-fade" aria-hidden /> : null}
    </>
  )
}

export function DeviceFrame({
  children,
  className,
  showBottomFade = true,
}: DeviceFrameProps) {
  const showDeviceMockFrame = useShowDeviceMockFrame()

  if (!showDeviceMockFrame) {
    return (
      <div className={cn('relative mx-auto flex min-h-dvh w-full max-w-lg flex-col', className)}>
        <AppShellContent
          showBottomFade={false}
          mainContentClassName="flex min-h-0 flex-1 flex-col outline-none"
        >
          {children}
        </AppShellContent>
      </div>
    )
  }

  function handleResetLocalData() {
    clearUserContext()
    window.location.reload()
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="fixed top-4 right-4 z-50 border-slate-300/80 bg-white/90 shadow-sm backdrop-blur-sm"
        onClick={handleResetLocalData}
      >
        Resetuj dane
      </Button>
      <div className="device-mock-host">
        <div className="marvel-device iphone-x">
          <div className="notch" />
          <div className={cn('screen screen-app relative', className)}>
            <AppShellContent
              showBottomFade={showBottomFade}
              mainContentClassName="screen-app-scroll outline-none"
            >
              {children}
            </AppShellContent>
          </div>
        </div>
      </div>
    </>
  )
}
