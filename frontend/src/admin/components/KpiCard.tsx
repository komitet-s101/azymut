import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type KpiCardProps = {
  label: string
  value: string
  hint: string
}

export function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <Card className="border-border/80">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight text-primary">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}
