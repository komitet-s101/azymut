export function apiBase(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim()
  if (configured) {
    return configured.replace(/\/$/, '')
  }
  return ''
}
