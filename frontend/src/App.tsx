import { useState } from 'react'

import { DeviceFrame } from '@/components/layout/DeviceFrame'
import { isOnboardingComplete, loadUserContext } from '@/lib/userContextStorage'
import { HomePage } from '@/pages/HomePage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { SearchResultsPage } from '@/pages/SearchResultsPage'

type AppView = 'home' | 'search-results'

function App() {
  const [onboarded, setOnboarded] = useState(() => isOnboardingComplete())
  const [view, setView] = useState<AppView>('home')
  const [lastQuery, setLastQuery] = useState('')
  const [initialRouteId, setInitialRouteId] = useState<number | null>(null)

  function handleSearch(query: string) {
    setInitialRouteId(null)
    setLastQuery(query)
    setView('search-results')
  }

  function handleBackHome() {
    setInitialRouteId(null)
    setView('home')
  }

  function handleOnboardingComplete() {
    setOnboarded(true)
    const routeId = loadUserContext()?.onboarding_route_id ?? null
    if (routeId !== null && routeId > 0) {
      setInitialRouteId(routeId)
      setView('search-results')
    }
  }

  return (
    <DeviceFrame showBottomFade={onboarded}>
      {!onboarded ? (
        <OnboardingPage onComplete={handleOnboardingComplete} />
      ) : view === 'home' ? (
        <HomePage onSearch={handleSearch} />
      ) : (
        <SearchResultsPage
          query={lastQuery}
          predefinedRouteId={initialRouteId}
          onBack={handleBackHome}
        />
      )}
    </DeviceFrame>
  )
}

export default App
