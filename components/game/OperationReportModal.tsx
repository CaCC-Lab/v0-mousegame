'use client'

import React, { useEffect, useRef, useState } from 'react'
import { FruitSprite } from './FruitSprite'
import { Button } from '@/components/ui/button'
import { buildOperationReport, type OperationTally } from '@/lib/operationReport'
import type { CumulativeOperationStats, SessionOperationStats } from '@/types/gamification'
import { translations } from '@/lib/i18n/translations'

export interface OperationReportModalProps {
  open: boolean
  onClose: () => void
  /** 記録を消す。渡さなければ「きろくを けす」を出さない */
  onReset?: () => void
  cumulativeStats: CumulativeOperationStats
  lastSessionStats: SessionOperationStats | null
  t: typeof translations.ja | typeof translations.en
}

function formatRate(tally: OperationTally | null): string {
  return tally?.rate == null ? '—' : `${tally.rate}%`
}

/** 先生・保護者むけ: 操作ごとの せいこう率（docs/game-spec.md §5） */
export function OperationReportModal({ open, onClose, onReset, cumulativeStats, lastSessionStats, t }: OperationReportModalProps): React.ReactElement | null {
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const resetRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const pressedOnBackdropRef = useRef(false)
  const [confirming, setConfirming] = useState(false)
  const confirmingRef = useRef(confirming)
  confirmingRef.current = confirming

  useEffect(() => {
    if (!open) setConfirming(false)
  }, [open])

  useEffect(() => {
    if (confirming) cancelRef.current?.focus()
  }, [confirming])

  const cancelReset = () => {
    setConfirming(false)
    resetRef.current?.focus()
  }
  const cancelResetRef = useRef(cancelReset)
  cancelResetRef.current = cancelReset

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    return () => opener?.focus()
  }, [open])

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Tab はダイアログ内のボタンだけを回し、後ろの画面（スタートなど）へ出さない。
  // 文字の選択などでフォーカスが外れても効くよう、document で受ける
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (confirmingRef.current) cancelResetRef.current()
        else onCloseRef.current()
      } else if (e.key === 'Tab') {
        e.preventDefault()
        const buttons = Array.from(dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [])
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
        if (index === -1) {
          closeRef.current?.focus()
          return
        }
        const step = e.shiftKey ? -1 : 1
        buttons[(index + step + buttons.length) % buttons.length]?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  if (!open) return null

  const r = t.operationReport
  const rows = buildOperationReport(cumulativeStats, lastSessionStats)
  const hasRecord = rows.some(row => row.total.attempts > 0)

  return (
    <div
      data-testid="operation-report-backdrop"
      onMouseDown={e => { pressedOnBackdropRef.current = e.target === e.currentTarget }}
      onClick={e => {
        // パネル内で押して背景で離した（文字の選択など）ときは閉じない
        if (pressedOnBackdropRef.current && e.target === e.currentTarget) onClose()
        pressedOnBackdropRef.current = false
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="operation-report-title"
        data-testid="operation-report"
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

        {onReset && (
          <div className="mt-4 border-t pt-4">
            <Button
              ref={resetRef}
              data-testid="report-reset"
              onClick={() => setConfirming(true)}
              disabled={!hasRecord}
              variant="outline"
              size="sm"
              className="text-red-700"
            >
              {r.reset}
            </Button>
            {confirming && (
              <div role="group" aria-label={r.reset} className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-900 mb-3">{r.resetConfirm}</p>
                <div className="flex gap-2">
                  <Button
                    data-testid="report-reset-confirm"
                    onClick={() => {
                      onReset()
                      setConfirming(false)
                      closeRef.current?.focus()
                    }}
                    size="sm"
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {r.resetConfirmButton}
                  </Button>
                  <Button ref={cancelRef} data-testid="report-reset-cancel" onClick={cancelReset} variant="outline" size="sm">
                    {r.resetCancel}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
