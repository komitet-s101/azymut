import type { ReactNode } from 'react'

import { WavePageHeader } from '@/components/layout/WavePageHeader'
import { appLayout } from '@/lib/appLayout'
import { cn } from '@/lib/utils'

type WaveHeroProps = {
  header: ReactNode
  children: ReactNode
}

export function WaveHero({ header, children }: WaveHeroProps) {
  return (
    <WavePageHeader
      header={header}
      contentClassName={cn(
        'pt-[max(2.5rem,calc(env(safe-area-inset-top)+1rem))]',
        appLayout.pageX,
      )}
    >
      {children}
    </WavePageHeader>
  )
}
