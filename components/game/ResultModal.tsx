'use client'

import React from 'react'
import { SessionOperationStats, StarRating, OPERATION_LABELS } from '@/types/gamification'
import { compareSessionSuccess, getEncouragementMessage } from '@/lib/gamificationManager'

const MAX_STARS = 3

/** 前回と比べてどうだったかを、矢印と言葉の両方で伝える */
const DELTA_DISPLAY = {
  up: { symbol: '↑', label: 'ふえた', className: 'text-green-600' },
  down: { symbol: '↓', label: 'へった', className: 'text-gray-500' },
  same: { symbol: '→', label: 'おなじ', className: 'text-gray-500' },
} as const

export interface ResultModalProps {
  open: boolean
  sessionStats: SessionOperationStats
  starRating: StarRating
  lastSessionStats: SessionOperationStats | null
  onClose: () => void
  labels?: {
    title: string
    close: string
    stars: string
    successCounts: string
    comparison: string
  }
}

export function ResultModal({
  open,
  sessionStats,
  starRating,
  lastSessionStats,
  onClose,
  labels = {
    title: 'れんしゅうけっか',
    close: 'とじる',
    stars: 'ほし',
    successCounts: 'せいこうかいすう',
    comparison: 'ぜんかいくらべ',
  },
}: ResultModalProps): React.ReactElement | null {
  if (!open) return null

  const encouragement = getEncouragementMessage(starRating)
  // 前回がなければ比較しない（比べる相手がいないのに「おなじ」と出ると誤解を生む）
  const deltas = lastSessionStats ? compareSessionSuccess(sessionStats, lastSessionStats) : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="max-w-lg w-full rounded-[var(--radius-xl)] bg-white p-6 shadow-xl">
        <h2
          id="result-modal-title"
          className="text-display text-2xl font-bold mb-1 text-center"
          style={{ color: 'var(--color-primary)' }}
        >
          {labels.title}
        </h2>

        {/* 獲得数にかかわらず3つ分の枠を見せて、あと何個かが分かるようにする */}
        <div
          className="mb-2 text-center text-3xl tracking-widest"
          data-testid="star-rating-display"
          aria-label={`${labels.stars} ${starRating} / ${MAX_STARS}`}
        >
          <span className="text-yellow-400">{'★'.repeat(starRating)}</span>
          <span className="text-gray-300">{'☆'.repeat(MAX_STARS - starRating)}</span>
        </div>

        <p
          className="mb-5 text-center text-lg font-bold text-gray-700"
          data-testid="encouragement-message"
        >
          {encouragement}
        </p>

        <div data-testid="session-success-counts" aria-label={labels.successCounts}>
          <div className="text-sm font-bold text-gray-500 mb-2">{labels.successCounts}</div>
          <ul className="space-y-1">
            {OPERATION_LABELS.map(({ key, icon, name }) => {
              const delta = deltas ? DELTA_DISPLAY[deltas[key]] : null

              return (
                <li
                  key={key}
                  className="flex items-center gap-2 rounded-[var(--radius-md)] bg-gray-50 px-3 py-2"
                >
                  <span aria-hidden>{icon}</span>
                  <span className="flex-1 font-semibold">{name}</span>
                  <span className="font-bold tabular-nums" data-testid={`success-${key}`}>
                    {sessionStats[key].success}かい
                  </span>
                  {delta && (
                    <span
                      className={`w-20 text-right text-sm font-semibold ${delta.className}`}
                      data-testid={`delta-${key}`}
                    >
                      {delta.symbol} {delta.label}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
          {deltas && (
            <div className="mt-2 text-xs text-gray-500 text-right" aria-hidden>
              {labels.comparison}
            </div>
          )}
        </div>

        <button
          type="button"
          className="mt-6 w-full rounded-[var(--radius-full)] px-4 py-3 text-white font-bold text-display shadow-playful"
          style={{ backgroundColor: 'var(--color-secondary)' }}
          onClick={onClose}
        >
          {labels.close}
        </button>
      </div>
    </div>
  )
}
