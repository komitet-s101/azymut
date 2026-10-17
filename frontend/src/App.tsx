import { useEffect, useState } from 'react'
import './App.css'

type HealthState =
  | { kind: 'loading' }
  | { kind: 'ok'; status: string; db: string }
  | { kind: 'error'; message: string }

const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

function App() {
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
    <main className="app">
      <header className="app__header">
        <h1>Leisure planner</h1>
        <p className="app__tagline">Sierpc / Gostynin — hackathon MVP</p>
      </header>

      <section className="card" aria-live="polite">
        <h2>API status</h2>
        <p className="api-base">
          <code>{apiBase}</code>
        </p>
        {health.kind === 'loading' && <p className="status status--loading">Checking…</p>}
        {health.kind === 'ok' && (
          <p className="status status--ok">
            Backend: <strong>{health.status}</strong>
            {health.db ? ` · DB: ${health.db}` : null}
          </p>
        )}
        {health.kind === 'error' && (
          <p className="status status--error">
            Could not reach API: {health.message}
          </p>
        )}
      </section>
    </main>
  )
}

export default App
