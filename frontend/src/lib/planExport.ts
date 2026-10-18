export type PlanExportStop = {
  order: number | null
  name: string
  category: string
  when: string | null
  location: string | null
  price: string
  visitMinutes: number | null
}

export type PlanExportDocument = {
  title: string
  subtitle: string
  contextLabel: string
  ticketNote: string
  weatherNote: string
  stops: PlanExportStop[]
  routeDistanceKm: number | null
  routeWalkMinutes: number | null
  visitMinutesTotal: number | null
  routeNote: string | null
  generatedAt: Date
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function formatGeneratedAt(date: Date): string {
  return date.toLocaleString('pl-PL', {
    dateStyle: 'long',
    timeStyle: 'short',
  })
}

export function formatPlanAsPlainText(doc: PlanExportDocument): string {
  const lines: string[] = [
    doc.title,
    doc.subtitle,
    doc.contextLabel,
    '',
    `Wygenerowano: ${formatGeneratedAt(doc.generatedAt)}`,
    '',
  ]

  if (doc.routeDistanceKm !== null || doc.routeWalkMinutes !== null || doc.visitMinutesTotal !== null) {
    lines.push('Podsumowanie trasy:')
    if (doc.visitMinutesTotal !== null) {
      lines.push(`• Szacowany czas zwiedzania: ok. ${doc.visitMinutesTotal} min`)
    }
    if (doc.routeDistanceKm !== null) {
      lines.push(`• Dystans między punktami: ${doc.routeDistanceKm.toFixed(1)} km`)
    }
    if (doc.routeWalkMinutes !== null) {
      lines.push(`• Marsz: ok. ${Math.round(doc.routeWalkMinutes)} min`)
    }
    if (doc.routeNote) {
      lines.push(`• ${doc.routeNote}`)
    }
    lines.push('')
  }

  lines.push('Punkty planu:')
  for (const stop of doc.stops) {
    const prefix = stop.order !== null ? `${stop.order}. ` : '• '
    lines.push(`${prefix}${stop.name} (${stop.category})`)
    if (stop.when) {
      lines.push(`   Termin: ${stop.when}`)
    }
    if (stop.location) {
      lines.push(`   Miejsce: ${stop.location}`)
    }
    lines.push(`   Bilety: ${stop.price}`)
    if (stop.visitMinutes) {
      lines.push(`   Czas: ok. ${stop.visitMinutes} min`)
    }
  }

  lines.push('', 'Bilety i ceny', doc.ticketNote, '', 'Pogoda', doc.weatherNote, '', '— Azymut, planer wolnego czasu')
  return lines.join('\n')
}

export function buildPlanPrintHtml(doc: PlanExportDocument): string {
  const stopsHtml = doc.stops
    .map((stop) => {
      const meta: string[] = []
      if (stop.when) {
        meta.push(`Termin: ${escapeHtml(stop.when)}`)
      }
      if (stop.location) {
        meta.push(`Adres: ${escapeHtml(stop.location)}`)
      }
      meta.push(`Bilety: ${escapeHtml(stop.price)}`)
      if (stop.visitMinutes) {
        meta.push(`Czas: ok. ${stop.visitMinutes} min`)
      }
      const orderBadge =
        stop.order !== null
          ? `<span class="order">${stop.order}</span>`
          : '<span class="order">•</span>'
      return `<li class="stop">
        ${orderBadge}
        <div>
          <strong>${escapeHtml(stop.name)}</strong>
          <span class="cat">${escapeHtml(stop.category)}</span>
          <p class="meta">${meta.join(' · ')}</p>
        </div>
      </li>`
    })
    .join('')

  const summaryParts: string[] = []
  if (doc.visitMinutesTotal !== null) {
    summaryParts.push(`Zwiedzanie: ok. ${doc.visitMinutesTotal} min`)
  }
  if (doc.routeDistanceKm !== null) {
    summaryParts.push(`Dystans: ${doc.routeDistanceKm.toFixed(1)} km`)
  }
  if (doc.routeWalkMinutes !== null) {
    summaryParts.push(`Marsz: ok. ${Math.round(doc.routeWalkMinutes)} min`)
  }

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(doc.title)} — Azymut</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, "Segoe UI", sans-serif; color: #0f172a; margin: 0; padding: 24px; line-height: 1.45; }
    h1 { font-size: 1.35rem; margin: 0 0 0.25rem; color: #0b3d91; }
    .sub { font-size: 0.95rem; color: #334155; margin: 0 0 0.5rem; }
    .ctx { font-size: 0.85rem; color: #64748b; margin: 0 0 1rem; }
    .meta-line { font-size: 0.8rem; color: #64748b; margin-bottom: 1.25rem; }
    .summary { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 14px; margin-bottom: 1.25rem; font-size: 0.9rem; }
    h2 { font-size: 1rem; margin: 1.25rem 0 0.5rem; }
    ol { list-style: none; padding: 0; margin: 0; }
    .stop { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .order { flex-shrink: 0; width: 28px; height: 28px; border-radius: 999px; background: #0b3d91; color: #fff; font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center; }
    .cat { display: inline-block; margin-left: 8px; font-size: 0.75rem; font-weight: 600; color: #0b3d91; background: #eff6ff; padding: 2px 8px; border-radius: 4px; }
    .meta { margin: 4px 0 0; font-size: 0.82rem; color: #475569; }
    .note { font-size: 0.88rem; color: #334155; margin: 0.35rem 0 0; }
    footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; font-size: 0.75rem; color: #94a3b8; }
    @media print { body { padding: 12mm; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(doc.title)}</h1>
  <p class="sub">${escapeHtml(doc.subtitle)}</p>
  <p class="ctx">${escapeHtml(doc.contextLabel)}</p>
  <p class="meta-line">Wygenerowano: ${escapeHtml(formatGeneratedAt(doc.generatedAt))}</p>
  ${
    summaryParts.length > 0 || doc.routeNote
      ? `<div class="summary">
    ${summaryParts.map((part) => `<div>${escapeHtml(part)}</div>`).join('')}
    ${doc.routeNote ? `<div style="margin-top:6px;font-size:0.82rem">${escapeHtml(doc.routeNote)}</div>` : ''}
  </div>`
      : ''
  }
  <h2>Punkty planu</h2>
  <ol>${stopsHtml}</ol>
  <h2>Bilety i ceny</h2>
  <p class="note">${escapeHtml(doc.ticketNote)}</p>
  <h2>Pogoda</h2>
  <p class="note">${escapeHtml(doc.weatherNote)}</p>
  <footer>Azymut — planer wolnego czasu · azymut</footer>
</body>
</html>`
}

export function printPlanAsPdf(doc: PlanExportDocument): boolean {
  const html = buildPlanPrintHtml(doc)
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (!printWindow) {
    return false
  }
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  const runPrint = () => {
    printWindow.print()
    printWindow.close()
  }
  if (printWindow.document.readyState === 'complete') {
    runPrint()
  } else {
    printWindow.addEventListener('load', runPrint, { once: true })
  }
  return true
}

export async function sharePlan(doc: PlanExportDocument): Promise<'shared' | 'copied' | 'failed'> {
  const text = formatPlanAsPlainText(doc)
  const shareData: ShareData = {
    title: doc.title,
    text,
  }
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(shareData)
      return 'shared'
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'failed'
      }
    }
  }
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return 'copied'
    } catch {
      return 'failed'
    }
  }
  return 'failed'
}
