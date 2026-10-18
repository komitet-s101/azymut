import { ImageIcon } from 'lucide-react'

import { resolvePlaceCoverImageUrl, type PlaceCoverInput } from '@/lib/placeCoverImage'
import { cn } from '@/lib/utils'

type PlaceCoverImageProps = {
  name: string
  source: PlaceCoverInput | null
  aspectClassName?: string
  className?: string
}

export function PlaceCoverImage({
  name,
  source,
  aspectClassName = 'aspect-[16/9]',
  className,
}: PlaceCoverImageProps) {
  const imageUrl = resolvePlaceCoverImageUrl(source)

  return (
    <div
      className={cn('relative w-full overflow-hidden bg-muted', aspectClassName, className)}
      role={imageUrl ? undefined : 'img'}
      aria-label={imageUrl ? undefined : `Brak zdjęcia: ${name}`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={`Zdjęcie: ${name}`} className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/80 text-muted-foreground"
          aria-hidden={Boolean(imageUrl)}
        >
          <ImageIcon className="size-9 opacity-50" />
          <span className="text-xs font-medium">Zdjęcie wkrótce</span>
        </div>
      )}
    </div>
  )
}
