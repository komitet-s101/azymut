import { useState } from 'react'
import { FileDown, Share2 } from 'lucide-react'

import { PlanSectionHeading } from '@/components/search-results/PlanSectionHeading'
import { Button } from '@/components/ui/button'
import { appLayout } from '@/lib/appLayout'
import type { PlanExportDocument } from '@/lib/planExport'
import { printPlanAsPdf, sharePlan } from '@/lib/planExport'
import { cn } from '@/lib/utils'

type PlanExportActionsProps = {
  document: PlanExportDocument | null
}

type Feedback = { kind: 'shared' | 'copied' | 'pdf' | 'error'; message: string } | null

export function PlanExportActions({ document }: PlanExportActionsProps) {
  const [feedback, setFeedback] = useState<Feedback>(null)
  const disabled = document === null

  async function handleShare() {
    if (!document) {
      return
    }
    setFeedback(null)
    const result = await sharePlan(document)
    if (result === 'shared') {
      setFeedback({ kind: 'shared', message: 'Plan udostępniony.' })
    } else if (result === 'copied') {
      setFeedback({ kind: 'copied', message: 'Skopiowaliśmy plan do schowka.' })
    } else {
      setFeedback({ kind: 'error', message: 'Nie udało się udostępnić planu.' })
    }
  }

  function handlePdf() {
    if (!document) {
      return
    }
    setFeedback(null)
    const ok = printPlanAsPdf(document)
    if (ok) {
      setFeedback({ kind: 'pdf', message: 'Otworzyliśmy podgląd wydruku.' })
    } else {
      setFeedback({ kind: 'error', message: 'Nie udało się otworzyć podglądu wydruku.' })
    }
  }

  return (
    <section className={appLayout.sectionStack} aria-labelledby="plan-export-heading">
      <PlanSectionHeading id="plan-export-heading" title="Zapisz lub udostępnij" icon={Share2} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="default"
          className="h-11 flex-1 gap-2 rounded-full"
          disabled={disabled}
          onClick={() => void handleShare()}
        >
          <Share2 className="size-4 shrink-0 text-primary-foreground" aria-hidden />
          Udostępnij plan
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 gap-2 rounded-full"
          disabled={disabled}
          onClick={handlePdf}
        >
          <FileDown className={appLayout.metaIcon} aria-hidden />
          Zapisz jako PDF
        </Button>
      </div>
      {feedback ? (
        <p
          className={cn(
            'text-sm',
            feedback.kind === 'error' ? 'text-destructive' : 'text-foreground',
          )}
          role="status"
        >
          {feedback.message}
        </p>
      ) : null}
    </section>
  )
}
