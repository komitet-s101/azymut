import { useEffect, useId, useRef, useState } from 'react'
import { Accessibility, Contrast, Glasses, PauseCircle, Type, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  applyAccessibilityPreferences,
  loadAccessibilityPreferences,
  nextTextScale,
  saveAccessibilityPreferences,
  textScaleLabel,
  type AccessibilityPreferences,
} from '@/lib/accessibilityPreferences'
import { cn } from '@/lib/utils'

function updatePreferences(
  current: AccessibilityPreferences,
  patch: Partial<AccessibilityPreferences>,
  setState: (value: AccessibilityPreferences) => void,
) {
  const next = { ...current, ...patch }
  setState(next)
  saveAccessibilityPreferences(next)
  applyAccessibilityPreferences(next)
}

function preferencesActive(prefs: AccessibilityPreferences): boolean {
  return (
    prefs.textScale !== 'default' ||
    prefs.highContrast ||
    prefs.reduceMotion ||
    prefs.colorBlindMode
  )
}

export function AccessibilityToolbar() {
  const [prefs, setPrefs] = useState(() => loadAccessibilityPreferences())
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    function onPointerDown(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }
      if (!rootRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [open])

  const active = preferencesActive(prefs)

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute right-3 bottom-[max(4.75rem,calc(env(safe-area-inset-bottom)+3.5rem))] z-40"
    >
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        {open ? (
          <div
            id={panelId}
            role="dialog"
            aria-modal="false"
            aria-label="Ustawienia dostępności"
            className="flex w-[min(100vw-1.5rem,16rem)] flex-col gap-1 rounded-2xl border border-border/80 bg-background/98 p-2 shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-center justify-between gap-2 px-1 pb-0.5">
              <span className="text-xs font-semibold text-foreground">Dostępność</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-8 rounded-full"
                aria-label="Zamknij ustawienia dostępności"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" aria-hidden />
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'h-10 w-full justify-start gap-2 rounded-xl px-3 text-sm font-medium',
                prefs.textScale !== 'default' && 'bg-secondary text-secondary-foreground',
              )}
              aria-pressed={prefs.textScale !== 'default'}
              aria-label={`Rozmiar tekstu: ${textScaleLabel(prefs.textScale)}. Kliknij, aby zmienić.`}
              onClick={() =>
                updatePreferences(prefs, { textScale: nextTextScale(prefs.textScale) }, setPrefs)
              }
            >
              <Type className="size-4 shrink-0" aria-hidden />
              Tekst ({textScaleLabel(prefs.textScale)})
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'h-10 w-full justify-start gap-2 rounded-xl px-3 text-sm font-medium',
                prefs.colorBlindMode && 'bg-secondary text-secondary-foreground',
              )}
              aria-pressed={prefs.colorBlindMode}
              aria-label={
                prefs.colorBlindMode
                  ? 'Wyłącz kolory przyjazne daltonistom'
                  : 'Włącz kolory przyjazne daltonistom (żółty i fiolet)'
              }
              onClick={() =>
                updatePreferences(prefs, { colorBlindMode: !prefs.colorBlindMode }, setPrefs)
              }
            >
              <Glasses className="size-4 shrink-0" aria-hidden />
              {prefs.colorBlindMode ? 'Daltonizm: włączony' : 'Kolory dla daltonistów'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'h-10 w-full justify-start gap-2 rounded-xl px-3 text-sm font-medium',
                prefs.highContrast && 'bg-secondary text-secondary-foreground',
              )}
              aria-pressed={prefs.highContrast}
              onClick={() =>
                updatePreferences(prefs, { highContrast: !prefs.highContrast }, setPrefs)
              }
            >
              <Contrast className="size-4 shrink-0" aria-hidden />
              {prefs.highContrast ? 'Kontrast: włączony' : 'Wyższy kontrast'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'h-10 w-full justify-start gap-2 rounded-xl px-3 text-sm font-medium',
                prefs.reduceMotion && 'bg-secondary text-secondary-foreground',
              )}
              aria-pressed={prefs.reduceMotion}
              onClick={() =>
                updatePreferences(prefs, { reduceMotion: !prefs.reduceMotion }, setPrefs)
              }
            >
              <PauseCircle className="size-4 shrink-0" aria-hidden />
              {prefs.reduceMotion ? 'Animacje: wyłączone' : 'Ogranicz ruch'}
            </Button>
          </div>
        ) : null}

        <Button
          type="button"
          variant="default"
          size="icon"
          className={cn(
            'size-11 rounded-full shadow-md',
            active && 'ring-2 ring-primary/40 ring-offset-2 ring-offset-background',
          )}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-haspopup="dialog"
          aria-label={open ? 'Zamknij menu dostępności' : 'Otwórz ustawienia dostępności'}
          onClick={() => setOpen((value) => !value)}
        >
          <Accessibility className="size-5" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
