import type { ReactNode } from 'react'

import { WavePageHeader } from '@/components/layout/WavePageHeader'

type WaveHeroProps = {
  header: ReactNode
  children: ReactNode
}

export function WaveHero({ header, children }: WaveHeroProps) {
  return (
    <WavePageHeader
      header={header}
      contentClassName="pt-[max(2.5rem,calc(env(safe-area-inset-top)+1rem))] px-5"
    >
      {children}
    </WavePageHeader>
  )
}
