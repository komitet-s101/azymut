import { Badge } from '@/components/ui/badge'

type FilterTagListProps = {
  tags: string[]
}

export function FilterTagList({ tags }: FilterTagListProps) {
  if (tags.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="font-normal">
          {tag}
        </Badge>
      ))}
    </div>
  )
}
