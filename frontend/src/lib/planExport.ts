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

  if (
    doc.routeDistanceKm !== null ||
    doc.routeWalkMinutes !== null ||
    doc.visitMinutesTotal !== null
  ) {
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

  lines.push('', 'Bilety i ceny', doc.ticketNote, '', 'Pogoda', doc.weatherNote, '', '— Azymut')
  return lines.join('\n')
}

function buildSummaryLines(doc: PlanExportDocument): string[] {
  const parts: string[] = []
  if (doc.visitMinutesTotal !== null) {
    parts.push(`Czas zwiedzania: ok. ${doc.visitMinutesTotal} min`)
  }
  if (doc.routeDistanceKm !== null) {
    parts.push(`Dystans: ${doc.routeDistanceKm.toFixed(1)} km`)
  }
  if (doc.routeWalkMinutes !== null) {
    parts.push(`Marsz: ok. ${Math.round(doc.routeWalkMinutes)} min`)
  }
  return parts
}

function buildStopBlock(stop: PlanExportStop): string {
  const prefix = stop.order !== null ? `${stop.order}. ` : ''
  const details: string[] = []
  if (stop.when) {
    details.push(`<li>Termin: ${escapeHtml(stop.when)}</li>`)
  }
  if (stop.location) {
    details.push(`<li>Miejsce: ${escapeHtml(stop.location)}</li>`)
  }
  details.push(`<li>Bilety: ${escapeHtml(stop.price)}</li>`)
  if (stop.visitMinutes) {
    details.push(`<li>Czas: ok. ${stop.visitMinutes} min</li>`)
  }
  return `<article class="stop">
    <h3 class="stop-title">${prefix}${escapeHtml(stop.name)}</h3>
    <p class="stop-cat">${escapeHtml(stop.category)}</p>
    <ul class="stop-details">${details.join('')}</ul>
  </article>`
}

export function buildPlanPrintHtml(doc: PlanExportDocument): string {
  const summary = buildSummaryLines(doc)
  const stopsHtml = doc.stops.map(buildStopBlock).join('')

  const summaryHtml =
    summary.length > 0 || doc.routeNote
      ? `<section class="box" aria-label="Podsumowanie">
    ${summary.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
    ${doc.routeNote ? `<p class="small">${escapeHtml(doc.routeNote)}</p>` : ''}
  </section>`
      : ''

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(doc.title)} — Azymut</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #111827;
      margin: 0;
      padding: 0;
    }
    .page { max-width: 180mm; margin: 0 auto; }
    h1 { font-size: 16pt; font-weight: 700; margin: 0 0 6pt; color: #0b3d91; }
    .lead { margin: 0 0 4pt; color: #334155; }
    .ctx { margin: 0 0 10pt; font-size: 10pt; color: #64748b; }
    .stamp { margin: 0 0 14pt; font-size: 9pt; color: #64748b; }
    h2 {
      font-size: 12pt;
      font-weight: 700;
      margin: 16pt 0 8pt;
      padding-bottom: 4pt;
      border-bottom: 1px solid #cbd5e1;
      color: #0f172a;
    }
    .box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10pt 12pt;
      margin-bottom: 12pt;
    }
    .box p { margin: 0 0 4pt; }
    .box p:last-child { margin-bottom: 0; }
    .small { font-size: 9pt; color: #475569; }
    .stop {
      margin: 0 0 12pt;
      padding-bottom: 10pt;
      border-bottom: 1px solid #e2e8f0;
      page-break-inside: avoid;
    }
    .stop:last-child { border-bottom: 0; padding-bottom: 0; }
    .stop-title { font-size: 11pt; font-weight: 700; margin: 0; }
    .stop-cat { margin: 2pt 0 6pt; font-size: 9pt; font-weight: 600; color: #0b3d91; }
    .stop-details { margin: 0; padding-left: 16pt; font-size: 10pt; color: #334155; }
    .stop-details li { margin: 2pt 0; }
    .note { margin: 0; font-size: 10pt; color: #334155; }
    footer {
      margin-top: 18pt;
      padding-top: 10pt;
      border-top: 1px solid #e2e8f0;
      font-size: 9pt;
      color: #94a3b8;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="page">
    <header>
      <h1>${escapeHtml(doc.title)}</h1>
      <p class="lead">${escapeHtml(doc.subtitle)}</p>
      <p class="ctx">${escapeHtml(doc.contextLabel)}</p>
      <p class="stamp">Wygenerowano: ${escapeHtml(formatGeneratedAt(doc.generatedAt))}</p>
    </header>
    ${summaryHtml}
    <h2>Punkty planu</h2>
    ${stopsHtml}
    <h2>Bilety i ceny</h2>
    <p class="note">${escapeHtml(doc.ticketNote)}</p>
    <h2>Pogoda</h2>
    <p class="note">${escapeHtml(doc.weatherNote)}</p>
    <footer>Azymut — planer wolnego czasu</footer>
  </div>
</body>
</html>`
}

export function printPlanAsPdf(doc: PlanExportDocument): boolean {
  const html = buildPlanPrintHtml(doc)
  const iframe = document.createElement('iframe')
  iframe.setAttribute('title', 'Podgląd planu do zapisu')
  iframe.setAttribute('aria-hidden', 'true')
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
  })
  document.body.appendChild(iframe)

  const frameWindow = iframe.contentWindow
  const frameDoc = iframe.contentDocument ?? frameWindow?.document
  if (!frameWindow || !frameDoc) {
    iframe.remove()
    return false
  }

  frameDoc.open()
  frameDoc.write(html)
  frameDoc.close()

  let cleaned = false
  const cleanup = () => {
    if (cleaned) {
      return
    }
    cleaned = true
    iframe.remove()
  }

  frameWindow.addEventListener('afterprint', cleanup, { once: true })
  window.setTimeout(cleanup, 120_000)

  const triggerPrint = () => {
    frameWindow.focus()
    frameWindow.print()
  }

  if (frameDoc.readyState === 'complete') {
    window.setTimeout(triggerPrint, 150)
  } else {
    frameWindow.addEventListener('load', () => window.setTimeout(triggerPrint, 150), {
      once: true,
    })
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
