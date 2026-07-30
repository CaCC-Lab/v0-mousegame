'use client'

import React from 'react'
import type { CumulativeOperationStats, MasteryLevel, OperationMasteryData } from '@/types/gamification'
import { MASTERY_THRESHOLDS, OPERATION_LABELS } from '@/types/gamification'
import type { InteractionType } from '@/types/game'

const MASTERY_LABELS: Record<MasteryLevel, string> = Object.fromEntries(
  MASTERY_THRESHOLDS.map(t => [t.level, t.label])
) as Record<MasteryLevel, string>

export interface MasteryDisplayProps {
  masteryLevels: OperationMasteryData
  masteryProgress: {
    [K in InteractionType]: { current: number; nextThreshold: number; remaining: number } | null
  }
  cumulativeStats: CumulativeOperationStats
}

export function MasteryDisplay({ masteryLevels, masteryProgress, cumulativeStats }: MasteryDisplayProps): React.ReactElement {
  return (
    <div data-testid="mastery-display" className="grid gap-3">
      {OPERATION_LABELS.map(({ key, icon, name }) => {
        const level = masteryLevels[key]
        const label = MASTERY_LABELS[level]
        const prog = masteryProgress[key]
        const total = cumulativeStats[key].totalSuccess
        return (
          <div
            key={key}
            data-testid={`mastery-row-${key}`}
            className="rounded border p-3"
            aria-label={`mastery-${key}`}
          >
            <div className="flex items-center gap-2 font-semibold">
              <span aria-hidden>{icon}</span>
              <span>{name}</span>
              <span data-testid={`mastery-level-${key}`} className="text-blue-600">Lv.{level}</span>
              <span data-testid={`mastery-label-${key}`} className="text-sm text-gray-500">{label}</span>
            </div>
            <div data-testid={`mastery-total-${key}`} className="mt-1 text-sm text-gray-600">
              累計成功: {total}
            </div>
            {prog ? (
              <div className="mt-1">
                <div
                  data-testid={`mastery-progress-${key}`}
                  className="h-2 w-full rounded bg-gray-200"
                  role="progressbar"
                  aria-label={`${name}のレベル進捗`}
                  aria-valuenow={prog.current}
                  aria-valuemax={prog.nextThreshold}
                >
                  <div
                    className="h-2 rounded bg-green-500"
                    style={{ width: `${Math.min(100, (prog.current / prog.nextThreshold) * 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  次まで {prog.remaining} / 閾値 {prog.nextThreshold}
                </div>
              </div>
            ) : (
              <div data-testid={`mastery-progress-${key}`} className="mt-1 text-sm font-bold text-yellow-500">
                MAX
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
