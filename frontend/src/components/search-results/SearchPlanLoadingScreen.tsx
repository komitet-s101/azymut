import { Loader2 } from 'lucide-react'

type SearchPlanLoadingScreenProps = {
  message: string
}

export function SearchPlanLoadingScreen({ message }: SearchPlanLoadingScreenProps) {
  return (
    <div
      className="home-surface-texture flex flex-1 flex-col items-center justify-center gap-4 px-8 pt-10 pb-[max(2rem,env(safe-area-inset-bottom))]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="size-10 animate-spin text-primary" aria-hidden />
      <p className="max-w-xs text-center text-sm leading-snug text-muted-foreground">{message}</p>
    </div>
  )
}
