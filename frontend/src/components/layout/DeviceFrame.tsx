import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { clearUserContext } from '@/lib/userContextStorage'

const useDeviceMock = (): boolean => {
  const raw = import.meta.env.VITE_DEVICE_MOCK
  if (raw === undefined || raw === '') {
    return true
  }
  return raw !== 'false' && raw !== '0'
}

type DeviceFrameProps = {
  children: ReactNode
  className?: string
  showBottomFade?: boolean
}

export function DeviceFrame({
  children,
  className,
  showBottomFade = true,
}: DeviceFrameProps) {
  if (!useDeviceMock()) {
    return (
      <div className={cn('mx-auto flex min-h-dvh w-full max-w-lg flex-col', className)}>
        {children}
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
          <div className={cn('screen screen-app', className)}>
            <div className="screen-app-scroll">{children}</div>
            {showBottomFade ? <div className="screen-app-fade" aria-hidden /> : null}
          </div>
        </div>
      </div>
    </>
  )
}
