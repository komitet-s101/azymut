import type { ReactNode } from 'react'

type WaveHeroProps = {
  header: ReactNode
  children: ReactNode
}

export function WaveHero({ header, children }: WaveHeroProps) {
  return (
    <section className="relative bg-primary pb-16 text-primary-foreground">
      {header}
      <div className="mt-6 flex justify-center px-5">{children}</div>
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
