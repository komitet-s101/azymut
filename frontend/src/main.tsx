import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { applyAccessibilityPreferences, loadAccessibilityPreferences } from '@/lib/accessibilityPreferences'
import { RootApp } from './RootApp.tsx'

applyAccessibilityPreferences(loadAccessibilityPreferences())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
)
