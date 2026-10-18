import { SlidersHorizontal } from 'lucide-react'

import { HeroWaveTitle } from '@/components/layout/HeroWaveTitle'

const HEADER_TITLE = 'Personalizacja'
const HEADER_LEAD = 'Ustaw profil — dopasujemy plany do Ciebie'

export function OnboardingPageHeader() {
  return <HeroWaveTitle icon={SlidersHorizontal} title={HEADER_TITLE} lead={HEADER_LEAD} />
}
