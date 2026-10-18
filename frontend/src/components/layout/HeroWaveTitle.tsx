import type { LucideIcon } from 'lucide-react'

import { appLayout } from '@/lib/appLayout'
import { cn } from '@/lib/utils'

type HeroWaveTitleProps = {
  icon: LucideIcon
  title: string
  lead?: string
  className?: string
}

export function HeroWaveTitle({ icon: Icon, title, lead, className }: HeroWaveTitleProps) {
  return (
    <header className={cn('text-center text-primary-foreground', className)}>
      <div className={appLayout.heroIconWrap}>
        <Icon className={appLayout.heroIcon} aria-hidden />
      </div>
      <h1 className={appLayout.heroTitle}>{title}</h1>
      {lead ? (
        <p className={cn(appLayout.heroLead, 'mx-auto max-w-[18rem] line-clamp-2')}>{lead}</p>
      ) : null}
    </header>
  )
}
