import { SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type HomeEditInterestsButtonProps = {
  onClick: () => void
  className?: string
}

export function HomeEditInterestsButton({ onClick, className }: HomeEditInterestsButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn('rounded-full border-border/80 bg-white/80 shadow-sm', className)}
      onClick={onClick}
    >
      <SlidersHorizontal className="size-4" aria-hidden />
      Zmień zainteresowania
    </Button>
  )
}
