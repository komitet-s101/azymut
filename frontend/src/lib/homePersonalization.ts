import type { LucideIcon } from 'lucide-react'
import { MapPinned } from 'lucide-react'

import { CUSTOM_INTEREST_ID, INTEREST_CATEGORIES } from '@/data/interestCategories'
import type { UserContextLocal } from '@/types/userContext'

export function selectedInterestLabels(context: UserContextLocal | null): string[] {
  if (!context?.interest_tag_ids?.length) {
    return []
  }
  const labels: string[] = []
  for (const id of context.interest_tag_ids) {
    if (id === CUSTOM_INTEREST_ID) {
      const custom = context.custom_request?.trim()
      if (custom) {
        labels.push(custom)
      }
      continue
    }
    const option = INTEREST_CATEGORIES.find((item) => item.id === id)
    if (option) {
      labels.push(option.label)
    }
  }
  return labels
}

export const HOME_FOR_YOU_SECTION_TITLE = 'Dla Ciebie'
export const HOME_FOR_YOU_SECTION_ICON: LucideIcon = MapPinned
