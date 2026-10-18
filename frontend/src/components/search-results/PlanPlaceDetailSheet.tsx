import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, Clock, MapPin, Ticket, X } from 'lucide-react'

import { PlaceCoverImage } from '@/components/place/PlaceCoverImage'
import { PlanCategoryBadge } from '@/components/search-results/PlanCategoryBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { appLayout } from '@/lib/appLayout'
import { fetchPlaceDetail, type PlaceDetail } from '@/lib/placeApi'
import { categoryLabel, priceLabel, type SearchResult } from '@/lib/searchApi'
import { getPlanSheetPortalRoot, lockAppScroll, unlockAppScroll } from '@/lib/scrollLock'
import { cn } from '@/lib/utils'

type PlanPlaceDetailSheetProps = {
  open: boolean
  item: SearchResult | null
  trailOrder?: number
  onClose: () => void
}

type PlaceDetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; place: PlaceDetail }
  | { status: 'error' }

function formatVisitMinutes(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60
    return rest > 0 ? `ok. ${hours} h ${rest} min` : `ok. ${hours} h`
  }
  return `ok. ${minutes} min`
}

export function PlanPlaceDetailSheet({
  open,
  item: itemProp,
  trailOrder,
  onClose,
}: PlanPlaceDetailSheetProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const [placeDetail, setPlaceDetail] = useState<PlaceDetailState>({ status: 'idle' })
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)
  const [displayItem, setDisplayItem] = useState<SearchResult | null>(null)
  const [isPresent, setIsPresent] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setPortalRoot(getPlanSheetPortalRoot())
  }, [])

  useEffect(() => {
    if (itemProp) {
      setDisplayItem(itemProp)
    }
  }, [itemProp])

  useEffect(() => {
    if (open && itemProp) {
      setIsPresent(true)
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true))
      })
      return () => cancelAnimationFrame(frame)
    }
    setIsVisible(false)
    return undefined
  }, [open, itemProp])

  useEffect(() => {
    if (!isPresent) {
      return
    }
    lockAppScroll()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      unlockAppScroll()
    }
  }, [isPresent, onClose])

  useEffect(() => {
    if (!isPresent || isVisible) {
      return
    }
    const panel = panelRef.current
    function finishClose() {
      setIsPresent(false)
      setDisplayItem(null)
      setPlaceDetail({ status: 'idle' })
    }
    if (!panel) {
      finishClose()
      return
    }
    const fallbackId = window.setTimeout(finishClose, 320)
    function handleTransitionEnd(event: TransitionEvent) {
      if (event.target !== panel || event.propertyName !== 'transform') {
        return
      }
      window.clearTimeout(fallbackId)
      finishClose()
    }
    panel.addEventListener('transitionend', handleTransitionEnd)
    return () => {
      window.clearTimeout(fallbackId)
      panel.removeEventListener('transitionend', handleTransitionEnd)
    }
  }, [isPresent, isVisible])

  useEffect(() => {
    if (!isPresent || !displayItem) {
      setPlaceDetail({ status: 'idle' })
      return
    }
    if (displayItem.kind !== 'place') {
      setPlaceDetail({ status: 'idle' })
      return
    }
    const controller = new AbortController()
    setPlaceDetail({ status: 'loading' })
    fetchPlaceDetail(displayItem.id, controller.signal)
      .then((place) => setPlaceDetail({ status: 'ready', place }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        setPlaceDetail({ status: 'error' })
      })
    return () => controller.abort()
  }, [isPresent, displayItem])

  if (!isPresent || !displayItem || !portalRoot) {
    return null
  }

  const item = displayItem

  const when = [item.start_date, item.start_time].filter(Boolean).join(' · ')
  const placeLine =
    placeDetail.status === 'ready'
      ? [placeDetail.place.city, placeDetail.place.address_line].filter(Boolean).join(' · ')
      : [item.city, item.address_line].filter(Boolean).join(' · ')

  const coverSource =
    placeDetail.status === 'ready'
      ? placeDetail.place
      : { external_id: item.external_id }

  const description =
    placeDetail.status === 'ready' && placeDetail.place.description
      ? placeDetail.place.description
      : item.reason

  const officialUrl =
    placeDetail.status === 'ready' ? placeDetail.place.official_url : null
  const bookingUrl = placeDetail.status === 'ready' ? placeDetail.place.booking_url : null

  const visitMinutes =
    placeDetail.status === 'ready'
      ? (placeDetail.place.typical_visit_minutes ?? item.typical_visit_minutes)
      : item.typical_visit_minutes

  const dockedToPhoneScreen =
    portalRoot.classList.contains('screen-app') && portalRoot.classList.contains('screen')

  return createPortal(
    <div
      className={cn(
        'inset-0 z-50 flex items-end justify-center overflow-hidden overscroll-none',
        dockedToPhoneScreen ? 'absolute' : 'fixed',
      )}
    >
      <button
        type="button"
        className={cn(
          'azymut-plan-sheet-backdrop absolute inset-0 bg-black/45',
          isVisible && 'is-visible',
        )}
        aria-label="Zamknij szczegóły"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'azymut-plan-sheet-panel relative z-10 flex max-h-[88%] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border/80 bg-background shadow-xl',
          isVisible && 'is-visible',
        )}
      >
        <div className="relative w-full shrink-0 overflow-hidden border-b border-border/60">
          <PlaceCoverImage name={item.name} source={coverSource} aspectClassName="aspect-[16/10]" />
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="absolute top-3 right-3 size-9 rounded-full border-0 bg-background/95 shadow-sm"
            aria-label="Zamknij"
            onClick={onClose}
          >
            <X className="size-4 text-foreground" aria-hidden />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          <h2 id={titleId} className={cn(appLayout.cardTitle, 'pr-2')}>
            {item.name}
          </h2>

          <div className={appLayout.resultMetaPanel}>
            <div className="flex flex-wrap items-center gap-1.5">
              {trailOrder ? (
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  Przystanek {trailOrder}
                </Badge>
              ) : null}
              {item.kind === 'place' && item.category ? (
                <PlanCategoryBadge category={item.category} />
              ) : (
                <Badge variant="secondary">
                  {item.kind === 'event' ? 'Wydarzenie' : categoryLabel(item.category)}
                </Badge>
              )}
            </div>
            <div className={cn(appLayout.metaStack, 'text-foreground/85')}>
              {placeLine ? (
                <span className={appLayout.metaRow}>
                  <MapPin className={appLayout.metaIcon} aria-hidden />
                  {placeLine}
                </span>
              ) : null}
              {when ? (
                <span className={appLayout.metaRow}>
                  <CalendarDays className={appLayout.metaIcon} aria-hidden />
                  {when}
                </span>
              ) : null}
              <span className={appLayout.metaRow}>
                <Ticket className={appLayout.metaIcon} aria-hidden />
                {priceLabel(item.price_level, item.flags)}
              </span>
              {visitMinutes ? (
                <span className={appLayout.metaRow}>
                  <Clock className={appLayout.metaIcon} aria-hidden />
                  {formatVisitMinutes(visitMinutes)}
                </span>
              ) : null}
              {item.flags.includes('check_hours') ? (
                <span className={cn(appLayout.metaRow, appLayout.bodyMuted)}>
                  Sprawdź godziny otwarcia u organizatora
                </span>
              ) : null}
            </div>
          </div>

          {item.kind === 'place' && placeDetail.status === 'loading' ? (
            <p className={appLayout.bodyMuted} role="status">
              Ładujemy pełny opis…
            </p>
          ) : null}

          {description ? (
            <section className="flex flex-col gap-1.5" aria-label="Opis">
              <h3 className="text-sm font-semibold text-foreground">Opis</h3>
              <p className="text-sm leading-relaxed text-foreground">{description}</p>
            </section>
          ) : null}

          {item.kind === 'place' && placeDetail.status === 'error' ? (
            <p className={appLayout.bodyMuted}>
              Nie udało się pobrać pełnego opisu — powyżej podstawowe informacje z planu.
            </p>
          ) : null}

          {officialUrl || bookingUrl ? (
            <div className="flex flex-wrap gap-4 border-t border-border/60 pt-4">
              {officialUrl ? (
                <a
                  href={officialUrl}
                  className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Strona miejsca
                </a>
              ) : null}
              {bookingUrl ? (
                <a
                  href={bookingUrl}
                  className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Rezerwacja
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    portalRoot,
  )
}
