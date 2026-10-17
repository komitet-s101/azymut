import { AiSearchBar } from '@/components/home/AiSearchBar'
import { HomeHeader } from '@/components/home/HomeHeader'
import { UpcomingEventsSection } from '@/components/home/UpcomingEventsSection'
import { WaveHero } from '@/components/home/WaveHero'

type HomePageProps = {
  onSearch?: (query: string) => void
}

export function HomePage({ onSearch }: HomePageProps) {
  return (
    <div className="flex min-h-full flex-col">
      <WaveHero header={<HomeHeader />}>
        <AiSearchBar onSearch={onSearch} />
      </WaveHero>
      <div className="home-surface-texture flex-1">
        <UpcomingEventsSection />
      </div>
    </div>
  )
}
