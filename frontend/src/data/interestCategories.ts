import type { LucideIcon } from 'lucide-react'
import {
  Church,
  Clapperboard,
  Gamepad2,
  Landmark,
  Leaf,
  Music,
  PartyPopper,
  PenLine,
  ShoppingBag,
  Trees,
  Trophy,
  UtensilsCrossed,
  Volleyball,
  Wrench,
} from 'lucide-react'

export const CUSTOM_INTEREST_ID = 'custom'

export type InterestCategoryId =
  | 'historia_zabytki'
  | 'sport_aktywny_wypoczynek'
  | 'sakralne_wielokulturowosc'
  | 'warsztaty_nauka_pasje'
  | 'przyroda_spacery_widoki'
  | 'jedzenie_lokalne_smaki'
  | 'zabawa_gry_adrenalina'
  | 'kibicowanie_wydarzenia_sportowe'
  | 'kultura_sztuka_film'
  | 'muzyka_widowiska'
  | 'relaks_wypoczynek'
  | 'rzemioslo_pamiatki_produkty'
  | 'festiwale_lokalne_swieta'
  | typeof CUSTOM_INTEREST_ID

export type InterestTone = {
  surface: string
  surfaceActive: string
  icon: string
  border: string
  borderActive: string
}

export type OnboardingInterestOption = {
  id: InterestCategoryId
  label: string
  icon: LucideIcon
  tone: InterestTone
}

const TONES: InterestTone[] = [
  {
    surface: 'bg-amber-50/95',
    surfaceActive: 'bg-amber-100/95',
    icon: 'text-amber-900',
    border: 'border-amber-100',
    borderActive: 'border-amber-300',
  },
  {
    surface: 'bg-sky-50/95',
    surfaceActive: 'bg-sky-100/95',
    icon: 'text-sky-900',
    border: 'border-sky-100',
    borderActive: 'border-sky-300',
  },
  {
    surface: 'bg-emerald-50/95',
    surfaceActive: 'bg-emerald-100/95',
    icon: 'text-emerald-900',
    border: 'border-emerald-100',
    borderActive: 'border-emerald-300',
  },
  {
    surface: 'bg-orange-50/95',
    surfaceActive: 'bg-orange-100/95',
    icon: 'text-orange-900',
    border: 'border-orange-100',
    borderActive: 'border-orange-300',
  },
  {
    surface: 'bg-rose-50/95',
    surfaceActive: 'bg-rose-100/95',
    icon: 'text-rose-900',
    border: 'border-rose-100',
    borderActive: 'border-rose-300',
  },
  {
    surface: 'bg-violet-50/95',
    surfaceActive: 'bg-violet-100/95',
    icon: 'text-violet-900',
    border: 'border-violet-100',
    borderActive: 'border-violet-300',
  },
]

function toneAt(index: number): InterestTone {
  return TONES[index % TONES.length]
}

/** Kategorie zgodne z katalogiem miejsc (places.csv). */
export const INTEREST_CATEGORIES: OnboardingInterestOption[] = [
  { id: 'historia_zabytki', label: 'Historia i zabytki', icon: Landmark, tone: toneAt(0) },
  {
    id: 'sport_aktywny_wypoczynek',
    label: 'Sport i aktywność',
    icon: Volleyball,
    tone: toneAt(1),
  },
  {
    id: 'sakralne_wielokulturowosc',
    label: 'Sakralne',
    icon: Church,
    tone: toneAt(2),
  },
  {
    id: 'warsztaty_nauka_pasje',
    label: 'Warsztaty i pasje',
    icon: Wrench,
    tone: toneAt(3),
  },
  {
    id: 'przyroda_spacery_widoki',
    label: 'Przyroda i spacery',
    icon: Trees,
    tone: toneAt(4),
  },
  {
    id: 'jedzenie_lokalne_smaki',
    label: 'Jedzenie i smaki',
    icon: UtensilsCrossed,
    tone: toneAt(5),
  },
  {
    id: 'zabawa_gry_adrenalina',
    label: 'Zabawa i adrenalina',
    icon: Gamepad2,
    tone: toneAt(0),
  },
  {
    id: 'kibicowanie_wydarzenia_sportowe',
    label: 'Kibicowanie',
    icon: Trophy,
    tone: toneAt(1),
  },
  {
    id: 'kultura_sztuka_film',
    label: 'Kultura i sztuka',
    icon: Clapperboard,
    tone: toneAt(2),
  },
  { id: 'muzyka_widowiska', label: 'Muzyka', icon: Music, tone: toneAt(3) },
  { id: 'relaks_wypoczynek', label: 'Relaks', icon: Leaf, tone: toneAt(4) },
  {
    id: 'rzemioslo_pamiatki_produkty',
    label: 'Rzemiosło i pamiątki',
    icon: ShoppingBag,
    tone: toneAt(5),
  },
  {
    id: 'festiwale_lokalne_swieta',
    label: 'Festiwale, jarmarki i święta',
    icon: PartyPopper,
    tone: toneAt(0),
  },
]

export const CUSTOM_INTEREST_OPTION: OnboardingInterestOption = {
  id: CUSTOM_INTEREST_ID,
  label: 'Dodaj własne',
  icon: PenLine,
  tone: {
    surface: 'bg-slate-50/95',
    surfaceActive: 'bg-slate-100/95',
    icon: 'text-slate-800',
    border: 'border-slate-200',
    borderActive: 'border-slate-400',
  },
}

export function onboardingInterestOptions(): OnboardingInterestOption[] {
  return [...INTEREST_CATEGORIES, CUSTOM_INTEREST_OPTION]
}

/** Mapowanie na pakiet interest-packages (API planera) — tymczasowe. */
export function categoryToPackageId(
  categoryId: string,
  persona: 'tourist' | 'resident',
): string {
  const map: Record<string, string> = {
    historia_zabytki: 'culture_walk',
    sakralne_wielokulturowosc: 'culture_walk',
    przyroda_spacery_widoki: 'culture_walk',
    kultura_sztuka_film: 'culture_walk',
    warsztaty_nauka_pasje: 'family_fun',
    sport_aktywny_wypoczynek: 'family_fun',
    zabawa_gry_adrenalina: 'family_fun',
    kibicowanie_wydarzenia_sportowe: 'family_fun',
    jedzenie_lokalne_smaki: 'local_flavors',
    muzyka_widowiska: 'culture_walk',
    relaks_wypoczynek: 'rainy_day',
    rzemioslo_pamiatki_produkty: 'culture_walk',
    festiwale_lokalne_swieta: 'culture_walk',
  }
  return map[categoryId] ?? (persona === 'tourist' ? 'culture_walk' : 'family_fun')
}
