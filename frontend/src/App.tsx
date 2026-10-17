import { useState } from 'react'

import { DeviceFrame } from '@/components/layout/DeviceFrame'
import { isOnboardingComplete } from '@/lib/userContextStorage'
import { HomePage } from '@/pages/HomePage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { SearchResultsPage } from '@/pages/SearchResultsPage'

type AppView = 'home' | 'search-results'

function App() {
  const [onboarded, setOnboarded] = useState(() => isOnboardingComplete())
  const [view, setView] = useState<AppView>('home')
  const [lastQuery, setLastQuery] = useState('')

  function handleSearch(query: string) {
    setLastQuery(query)
    setView('search-results')
  }

  function handleBackHome() {
    setView('home')
  }

  return (
    <DeviceFrame showBottomFade={onboarded}>
      {!onboarded ? (
        <OnboardingPage onComplete={() => setOnboarded(true)} />
      ) : view === 'home' ? (
        <HomePage onSearch={handleSearch} />
      ) : (
        <SearchResultsPage query={lastQuery} onBack={handleBackHome} />
      )}
    </DeviceFrame>
  )
}

export default App
