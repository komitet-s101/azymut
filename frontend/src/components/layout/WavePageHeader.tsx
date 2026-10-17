import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type WavePageHeaderProps = {
  title?: ReactNode
  header?: ReactNode
  onBack?: () => void
  backLabel?: string
  children?: ReactNode
  className?: string
  contentClassName?: string
}

export function WavePageHeader({
  title,
  header,
  onBack,
  backLabel = 'Wróć',
  children,
  className,
  contentClassName,
}: WavePageHeaderProps) {
  return (
    <section
      className={cn(
        'relative bg-primary text-primary-foreground',
        children ? 'pb-16' : 'pb-14',
        className,
      )}
    >
      <div
        className={cn(
          'px-5 pt-[max(1.25rem,calc(env(safe-area-inset-top)+0.5rem))]',
          contentClassName,
        )}
      >
        {onBack ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="-ml-2 mb-3 text-white hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {backLabel}
          </Button>
        ) : null}
        {header ? (
          header
        ) : title ? (
          <h1 className="text-center text-xl font-semibold tracking-tight">{title}</h1>
        ) : null}
      </div>
      {children ? (
        <div className="mt-5 flex justify-center px-5">{children}</div>
      ) : null}
      <svg
        className="pointer-events-none absolute right-0 bottom-0 left-0 block h-10 w-full text-background"
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M0,32 C360,64 720,0 1080,24 C1260,36 1380,40 1440,32 L1440,48 L0,48 Z"
        />
      </svg>
    </section>
  )
}
