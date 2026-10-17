import { SlidersHorizontal } from 'lucide-react'

const HEADER_TITLE = 'Personalizacja'

export function OnboardingPageHeader() {
  return (
    <header className="text-center text-primary-foreground">
      <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
        <SlidersHorizontal className="size-5 text-white" aria-hidden />
      </div>
      <h1 className="font-heading text-2xl font-bold tracking-tight">{HEADER_TITLE}</h1>
    </header>
  )
}
