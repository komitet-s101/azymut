import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

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
}

export function DeviceFrame({ children, className }: DeviceFrameProps) {
  if (!useDeviceMock()) {
    return (
      <div className={cn('mx-auto flex min-h-dvh w-full max-w-lg flex-col', className)}>
        {children}
      </div>
    )
  }

  return (
    <div className="device-mock-host">
      <div className="marvel-device iphone-x">
        <div className="notch" />
        <div className={cn('screen screen-app', className)}>
          <div className="screen-app-scroll">{children}</div>
          <div className="screen-app-fade" aria-hidden />
        </div>
      </div>
    </div>
  )
}
