'use client'

import React, { useEffect, useRef } from 'react'
import { FruitSprite } from './FruitSprite'
import { Button } from '@/components/ui/button'
import { buildOperationReport, type OperationTally } from '@/lib/operationReport'
import type { CumulativeOperationStats, SessionOperationStats } from '@/types/gamification'
import { translations } from '@/lib/i18n/translations'

export interface OperationReportModalProps {
  open: boolean
  onClose: () => void
  cumulativeStats: CumulativeOperationStats
  lastSessionStats: SessionOperationStats | null
  t: typeof translations.ja | typeof translations.en
}

function formatRate(tally: OperationTally | null): string {
  return tally?.rate == null ? '—' : `${tally.rate}%`
}

/** 先生・保護者むけ: 操作ごとの せいこう率（docs/game-spec.md §5） */
export function OperationReportModal({ open, onClose, cumulativeStats, lastSessionStats, t }: OperationReportModalProps): React.ReactElement | null {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    return () => opener?.focus()
  }, [open])

  if (!open) return null

  // 操作できるのは「とじる」だけなので、Tab でも後ろの画面（スタートなど）へ出さない
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      closeRef.current?.focus()
    }
  }

  const r = t.operationReport
  const rows = buildOperationReport(cumulativeStats, lastSessionStats)
  const hasRecord = rows.some(row => row.total.attempts > 0)

  return (
    <div
      data-testid="operation-report-backdrop"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="operation-report-title"
        data-testid="operation-report"
        onKeyDown={handleKeyDown}
        className="max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between mb-2">
          <h2 id="operation-report-title" className="text-xl font-bold">{r.title}</h2>
          <Button ref={closeRef} data-testid="report-close" onClick={onClose} variant="outline" size="sm">
            {t.close}
          </Button>
        </div>
        <p className="text-sm text-gray-600 mb-4">{r.description}</p>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-left text-gray-600">
              <th scope="col" className="py-2">{r.operation}</th>
              <th scope="col" className="py-2 text-right">{r.success}</th>
              <th scope="col" className="py-2 text-right">{r.miss}</th>
              <th scope="col" className="py-2 text-right">{r.totalRate}</th>
              <th scope="col" className="py-2 text-right">{r.lastRate}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.operation} data-testid={`report-row-${row.operation}`} className="border-b">
                <th scope="row" className="py-2 text-left font-semibold">
                  <span className="inline-flex items-center gap-2">
                    <FruitSprite type={row.fruit} size={24} decorative />
                    {t.gamification.operations[row.operation]}
                  </span>
                </th>
                <td className="py-2 text-right tabular-nums">{row.total.success}</td>
                <td className="py-2 text-right tabular-nums">{row.total.fail}</td>
                <td data-testid="report-total-rate" className="py-2 text-right font-bold tabular-nums">
                  {formatRate(row.total)}
                  {row.total.rate != null && (
                    <span className="block h-1.5 mt-1 rounded bg-gray-200" aria-hidden>
                      <span className="block h-full rounded bg-green-500" style={{ width: `${row.total.rate}%` }} />
                    </span>
                  )}
                </td>
                <td data-testid="report-last-rate" className="py-2 text-right tabular-nums">{formatRate(row.last)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!hasRecord && <p className="mt-4 text-sm text-gray-600">{r.empty}</p>}
        <p className="mt-4 text-xs text-gray-500">{r.note}</p>
      </div>
    </div>
  )
}
