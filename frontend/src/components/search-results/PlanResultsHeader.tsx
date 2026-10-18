import { Sparkles } from 'lucide-react'

import { HeroWaveTitle } from '@/components/layout/HeroWaveTitle'

const HEADER_TITLE = 'Twój plan na dziś'

type PlanResultsHeaderProps = {
  planSummary: string
}

export function PlanResultsHeader({ planSummary }: PlanResultsHeaderProps) {
  return <HeroWaveTitle icon={Sparkles} title={HEADER_TITLE} lead={planSummary} />
}
