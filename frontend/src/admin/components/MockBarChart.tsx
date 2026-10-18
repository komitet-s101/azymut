import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BarChartItem } from '@/admin/lib/adminStats'

type MockBarChartProps = {
  title: string
  description?: string
  items: BarChartItem[]
  valueSuffix?: string
}

export function MockBarChart({ title, description, items, valueSuffix }: MockBarChartProps) {
  const max = Math.max(...items.map((item) => item.value), 1)

  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const widthPercent = Math.round((item.value / max) * 100)
          return (
            <div key={item.label} className="grid gap-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="min-w-0 truncate font-medium">{item.label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {item.value}
                  {valueSuffix ?? ''}
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-muted"
                role="presentation"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
