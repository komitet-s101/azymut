import { useEffect, useState } from 'react'

type HealthState =
  | { kind: 'loading' }
  | { kind: 'ok'; status: string; db: string }
  | { kind: 'error'; message: string }

const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

export function DevApiStatus() {
  const [health, setHealth] = useState<HealthState>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch(`${apiBase}/health`)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const body = (await response.json()) as { status?: string; db?: string }
        if (!cancelled) {
          setHealth({
            kind: 'ok',
            status: body.status ?? 'unknown',
            db: body.db ?? 'unknown',
          })
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Could not reach API'
          setHealth({ kind: 'error', message })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <aside
      className="border-t border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
      aria-live="polite"
    >
      <strong className="text-foreground">Dev:</strong>{' '}
      <code className="rounded bg-muted px-1">{apiBase}</code>
      {health.kind === 'loading' && ' · sprawdzanie…'}
      {health.kind === 'ok' && (
        <>
          {' '}
          · API <strong>{health.status}</strong>
          {health.db ? ` · DB ${health.db}` : null}
        </>
      )}
      {health.kind === 'error' && <> · błąd: {health.message}</>}
    </aside>
  )
}
