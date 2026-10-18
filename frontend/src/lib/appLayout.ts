/**
 * Wspólna skala odstępów, typografii i ikon (ekran główny, onboarding, wyniki).
 * Poziome marginesy strony: px-5 (1.25rem).
 */
export const appLayout = {
  pageX: 'px-5',
  pageBottom: 'pb-[max(1.5rem,env(safe-area-inset-bottom))]',
  pageContent: 'flex flex-1 flex-col gap-6 px-5 pt-6',
  planSummaryBlock: 'home-surface-texture flex flex-col gap-6 px-5 pt-6 pb-4',
  planCatalogBlock:
    'plan-results-catalog flex flex-col gap-4 px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]',
  onboardingScroll: 'scrollbar-hidden flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-6 pb-8',
  onboardingFooter: 'flex min-h-[6.5rem] flex-col justify-end bg-background/95 px-5 pt-4 pb-1 backdrop-blur-sm',
  onboardingPrivacy: 'shrink-0 px-5 pt-4 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))]',

  sectionStack: 'flex flex-col gap-4',
  listStack: 'flex flex-col gap-3',

  sectionTitle: 'flex items-center gap-2 text-lg font-semibold leading-snug text-foreground',
  sectionIcon: 'size-5 shrink-0 text-primary',
  stepIntro: 'mb-4 font-heading text-lg font-semibold leading-snug text-foreground',

  metaStack: 'flex flex-col gap-1.5 text-sm leading-snug text-muted-foreground',
  metaRow: 'inline-flex items-center gap-1.5',
  metaIcon: 'size-4 shrink-0 text-primary',

  cardShell: 'gap-0 overflow-hidden border-border/80 py-0',
  cardHeader: 'gap-2 px-4 py-4',
  cardTitle: 'text-base font-semibold leading-snug',
  resultMetaPanel:
    'flex flex-col gap-2 rounded-xl border border-border/80 bg-muted/35 px-4 py-3',

  callout:
    'rounded-xl border border-primary/20 bg-card px-4 py-3 shadow-sm ring-1 ring-primary/5',
  calloutLabel: 'text-[0.625rem] font-semibold uppercase tracking-wide text-primary/80',
  calloutBody: 'mt-1 font-heading text-base font-semibold leading-snug text-foreground',

  heroIconWrap:
    'mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25',
  heroIcon: 'size-5 text-white',
  heroTitle: 'font-heading text-2xl font-bold tracking-tight',
  heroLead: 'mt-1.5 px-3 font-heading text-sm font-normal leading-snug text-white/90',

  infoCard: 'flex-row items-start gap-3 border-border/80 p-4 shadow-sm',
  infoCardIconWrap: 'flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary',
  infoCardIcon: 'size-4 shrink-0 text-primary',
  infoCardText: 'text-left text-sm leading-relaxed text-foreground',

  choiceCard:
    'rounded-xl border bg-card px-4 py-3 text-left text-sm text-card-foreground shadow-sm transition-colors',
  choiceCardActive: 'border-primary bg-secondary text-foreground ring-1 ring-primary/20',
  choiceCardIdle: 'border-border/80 hover:border-border',
  choiceIcon: 'size-4 shrink-0 text-current',
  choiceIconWrap: 'flex size-9 shrink-0 items-center justify-center rounded-lg',
  choiceIconWrapActive: 'bg-primary text-primary-foreground',
  choiceIconWrapIdle: 'bg-muted text-muted-foreground',
  personaCard: 'grid w-full grid-cols-[2.25rem_1fr] items-center gap-3',
  personaIconWrap: 'flex size-9 items-center justify-center rounded-full bg-primary/10',
  toggleRow:
    'flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-left text-sm text-card-foreground shadow-sm transition-colors',
  fieldLabel: 'flex flex-col gap-2 text-sm font-medium text-foreground',
  inputField:
    'h-12 rounded-full border-border/80 bg-card px-4 text-foreground shadow-sm caret-primary',
  searchInputIcon: 'size-5 shrink-0 text-primary',

  mapFrame: 'h-[min(42vh,320px)] min-h-[220px] w-full',
  mapLoadingCenter: 'relative flex flex-col items-center justify-center gap-3 bg-muted px-6',
  mapLoadingIconWrap:
    'relative flex size-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-border/80',
  mapLoadingMapIcon: 'size-5 text-primary/70',
  mapLoadingSpinner: 'absolute -right-0.5 -bottom-0.5 size-4 animate-spin text-primary',

  bodyMuted: 'text-sm leading-snug text-muted-foreground',
  spinnerLg: 'size-10 animate-spin text-primary',
  loadingScreen: 'flex flex-1 flex-col items-center justify-center gap-4 px-5 pt-10',
} as const
