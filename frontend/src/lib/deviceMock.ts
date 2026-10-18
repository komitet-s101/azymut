import { useEffect, useState } from 'react'

const DEVICE_MOCK_MIN_WIDTH_PX = 768

const deviceMockMediaQuery = `(min-width: ${DEVICE_MOCK_MIN_WIDTH_PX}px)`

export function readDeviceMockFromEnv(): boolean {
  const raw = import.meta.env.VITE_DEVICE_MOCK
  if (raw === undefined || raw === '') {
    return true
  }
  return raw !== 'false' && raw !== '0'
}

function readViewportWideEnoughForMock(): boolean {
  return window.matchMedia(deviceMockMediaQuery).matches
}

/** Marvel phone frame only when env allows and viewport is at least 768px wide. */
export function useShowDeviceMockFrame(): boolean {
  const envEnabled = readDeviceMockFromEnv()
  const [wideEnough, setWideEnough] = useState(() => readViewportWideEnoughForMock())

  useEffect(() => {
    const mediaQueryList = window.matchMedia(deviceMockMediaQuery)
    const onChange = () => setWideEnough(mediaQueryList.matches)
    mediaQueryList.addEventListener('change', onChange)
    return () => mediaQueryList.removeEventListener('change', onChange)
  }, [])

  return envEnabled && wideEnough
}
