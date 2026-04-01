'use client'

import React from 'react'
import { SessionOperationStats, StarRating } from '@/types/gamification'
import { compareSessionSuccess, getEncouragementMessage } from '@/lib/gamificationManager'

const STAT_KEYS = ['click', 'doubleClick', 'rightClick', 'drop'] as const
const DELTA_SYMBOL = { up: '↑', down: '↓', same: '→' } as const

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
  const deltas = compareSessionSuccess(sessionStats, lastSessionStats)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="max-w-lg w-full rounded-xl bg-white p-6 shadow-xl">
        <h2 id="result-modal-title" className="text-2xl font-bold mb-2">
          {labels.title}
        </h2>
        <p className="mb-4 text-gray-700" data-testid="encouragement-message">
          {encouragement}
        </p>
        <div className="mb-4" data-testid="star-rating-display" aria-label={labels.stars}>
          {'★'.repeat(starRating)}
          {starRating === 0 && <span className="text-gray-400">—</span>}
        </div>
        <div data-testid="session-success-counts" aria-label={labels.successCounts}>
          <ul className="space-y-1 text-sm">
            {STAT_KEYS.map(key => (
              <li key={key} data-testid={`success-${key}`}>{key}: {sessionStats[key].success}</li>
            ))}
          </ul>
        </div>
        <div className="mt-4" data-testid="comparison-deltas" aria-label={labels.comparison}>
          <ul className="space-y-1 text-sm">
            {STAT_KEYS.map(key => (
              <li key={key} data-testid={`delta-${key}`}>
                {key}: {DELTA_SYMBOL[deltas[key]]}
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-white"
          onClick={onClose}
        >
          {labels.close}
        </button>
      </div>
    </div>
  )
}
