const STORAGE_KEY = 'azymut-a11y-v3'

export type TextScale = 'default' | 'large' | 'larger'

export type AccessibilityPreferences = {
  textScale: TextScale
  highContrast: boolean
  reduceMotion: boolean
  colorBlindMode: boolean
}

const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  textScale: 'default',
  highContrast: false,
  reduceMotion: false,
  colorBlindMode: false,
}

function isTextScale(value: unknown): value is TextScale {
  return value === 'default' || value === 'large' || value === 'larger'
}

function parseStoredPreferences(raw: string): AccessibilityPreferences | null {
  try {
    const parsed = JSON.parse(raw) as Partial<AccessibilityPreferences> & {
      darkTheme?: boolean
    }
    return {
      textScale: isTextScale(parsed.textScale) ? parsed.textScale : 'default',
      highContrast: parsed.highContrast === true,
      reduceMotion: parsed.reduceMotion === true,
      colorBlindMode: parsed.colorBlindMode === true,
    }
  } catch {
    return null
  }
}

export function loadAccessibilityPreferences(): AccessibilityPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES
  }
  const current = window.localStorage.getItem(STORAGE_KEY)
  if (current) {
    return parseStoredPreferences(current) ?? DEFAULT_PREFERENCES
  }
  const legacy = window.localStorage.getItem('azymut-a11y-v2')
  if (legacy) {
    const prefs = parseStoredPreferences(legacy) ?? DEFAULT_PREFERENCES
    saveAccessibilityPreferences(prefs)
    return prefs
  }
  return DEFAULT_PREFERENCES
}

export function saveAccessibilityPreferences(prefs: AccessibilityPreferences): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

const TEXT_SCALE_CLASSES: Record<TextScale, string | null> = {
  default: null,
  large: 'a11y-text-large',
  larger: 'a11y-text-larger',
}

export function textScaleLabel(scale: TextScale): string {
  switch (scale) {
    case 'default':
      return 'standardowy'
    case 'large':
      return 'większy'
    case 'larger':
      return 'największy'
    default: {
      const _exhaustive: never = scale
      return _exhaustive
    }
  }
}

export function nextTextScale(scale: TextScale): TextScale {
  switch (scale) {
    case 'default':
      return 'large'
    case 'large':
      return 'larger'
    case 'larger':
      return 'default'
    default: {
      const _exhaustive: never = scale
      return _exhaustive
    }
  }
}

export function applyAccessibilityPreferences(prefs: AccessibilityPreferences): void {
  const root = document.documentElement
  root.classList.remove(
    'a11y-text-large',
    'a11y-text-larger',
    'a11y-high-contrast',
    'a11y-reduce-motion',
    'a11y-color-blind',
    'dark',
  )

  const textClass = TEXT_SCALE_CLASSES[prefs.textScale]
  if (textClass) {
    root.classList.add(textClass)
  }
  if (prefs.highContrast) {
    root.classList.add('a11y-high-contrast')
  }
  if (prefs.colorBlindMode) {
    root.classList.add('a11y-color-blind')
  }
  if (prefs.reduceMotion) {
    root.classList.add('a11y-reduce-motion')
  }
}
