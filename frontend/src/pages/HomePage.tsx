import { AiSearchBar } from '@/components/home/AiSearchBar'
import { HomeCategoryChips } from '@/components/home/HomeCategoryChips'
import { HomeEditInterestsButton } from '@/components/home/HomeEditInterestsButton'
import { HomeHeader } from '@/components/home/HomeHeader'
import { HomeForYouSection } from '@/components/home/HomeForYouSection'
import { WaveHero } from '@/components/home/WaveHero'
import { appLayout } from '@/lib/appLayout'
import { cn } from '@/lib/utils'

type HomePageProps = {
  onSearch?: (query: string) => void
  onEditInterests?: () => void
}

export function HomePage({ onSearch, onEditInterests }: HomePageProps) {
  return (
    <div className="flex min-h-full flex-col">
      <WaveHero header={<HomeHeader />}>
        <AiSearchBar onSearch={onSearch} />
      </WaveHero>
      <div className="home-surface-texture flex-1">
        <div className={cn(appLayout.pageX, 'flex flex-col gap-3 pt-5')}>
          <HomeCategoryChips />
          {onEditInterests ? (
            <HomeEditInterestsButton className="self-start" onClick={onEditInterests} />
          ) : null}
        </div>
        <HomeForYouSection />
      </div>
    </div>
  )
}
