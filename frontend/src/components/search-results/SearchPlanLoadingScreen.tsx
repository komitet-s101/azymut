import { Loader2 } from 'lucide-react'

import { appLayout } from '@/lib/appLayout'
import { cn } from '@/lib/utils'

type SearchPlanLoadingScreenProps = {
  message: string
}

export function SearchPlanLoadingScreen({ message }: SearchPlanLoadingScreenProps) {
  return (
    <div
      className={cn(
        'home-surface-texture pb-[max(2rem,env(safe-area-inset-bottom))]',
        appLayout.loadingScreen,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className={appLayout.spinnerLg} aria-hidden />
      <p className={cn('max-w-xs text-center', appLayout.bodyMuted)}>{message}</p>
    </div>
  )
}
