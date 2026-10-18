import { useState } from 'react'

import { DeviceFrame } from '@/components/layout/DeviceFrame'
import {
  ScreenTransition,
  type ScreenTransitionDirection,
} from '@/components/layout/ScreenTransition'
import { isOnboardingComplete, loadUserContext } from '@/lib/userContextStorage'
import { HomePage } from '@/pages/HomePage'
import { OnboardingPage, type OnboardingEntry } from '@/pages/OnboardingPage'
import { SearchResultsPage } from '@/pages/SearchResultsPage'

type AppView = 'home' | 'search-results'

type AppScreenKey = 'onboarding' | 'onboarding-edit' | AppView

function App() {
  const [onboarded, setOnboarded] = useState(() => isOnboardingComplete())
  const [onboardingEntry, setOnboardingEntry] = useState<OnboardingEntry>('full')
  const [view, setView] = useState<AppView>('home')
  const [lastQuery, setLastQuery] = useState('')
  const [initialRouteId, setInitialRouteId] = useState<number | null>(null)
  const [transitionDirection, setTransitionDirection] =
    useState<ScreenTransitionDirection>('forward')

  const screenKey: AppScreenKey = !onboarded
    ? onboardingEntry === 'edit-interests'
      ? 'onboarding-edit'
      : 'onboarding'
    : view

  function handleSearch(query: string) {
    setTransitionDirection('forward')
    setInitialRouteId(null)
    setLastQuery(query)
    setView('search-results')
  }

  function handleBackHome() {
    setTransitionDirection('back')
    setInitialRouteId(null)
    setView('home')
  }

  function handleEditInterests() {
    setTransitionDirection('forward')
    setOnboardingEntry('edit-interests')
    setOnboarded(false)
    setView('home')
  }

  function handleOnboardingCancel() {
    setTransitionDirection('back')
    setOnboardingEntry('full')
    setOnboarded(true)
    setView('home')
  }

  function handleOnboardingComplete() {
    const wasEditingInterests = onboardingEntry === 'edit-interests'
    setTransitionDirection(wasEditingInterests ? 'back' : 'forward')
    setOnboardingEntry('full')
    setOnboarded(true)
    if (wasEditingInterests) {
      setView('home')
      return
    }
    const routeId = loadUserContext()?.onboarding_route_id ?? null
    if (routeId !== null && routeId > 0) {
      setInitialRouteId(routeId)
      setView('search-results')
    }
  }

  return (
    <DeviceFrame showBottomFade={onboarded}>
      <ScreenTransition
        screenKey={screenKey}
        direction={transitionDirection}
        flushBottom={screenKey === 'onboarding' || screenKey === 'onboarding-edit'}
      >
        {!onboarded ? (
          <OnboardingPage
            entry={onboardingEntry}
            onComplete={handleOnboardingComplete}
            onCancel={onboardingEntry === 'edit-interests' ? handleOnboardingCancel : undefined}
          />
        ) : view === 'home' ? (
          <HomePage onSearch={handleSearch} onEditInterests={handleEditInterests} />
        ) : (
          <SearchResultsPage
            query={lastQuery}
            predefinedRouteId={initialRouteId}
            onBack={handleBackHome}
          />
        )}
      </ScreenTransition>
    </DeviceFrame>
  )
}

export default App
