'use client'

import React from 'react'
import type { CumulativeOperationStats, OperationMasteryData } from '@/types/gamification'
import { OPERATION_LABELS } from '@/types/gamification'
import type { InteractionType } from '@/types/game'
import { translations } from '@/lib/i18n/translations'

export interface MasteryDisplayProps {
  masteryLevels: OperationMasteryData
  masteryProgress: {
    [K in InteractionType]: { current: number; nextThreshold: number; remaining: number } | null
  }
  cumulativeStats: CumulativeOperationStats
  /** 表示言語。省略時は日本語（既定の表示言語） */
  t?: typeof translations.ja
}

export function MasteryDisplay({ masteryLevels, masteryProgress, cumulativeStats, t = translations.ja }: MasteryDisplayProps): React.ReactElement {
  const g = t.gamification
  return (
    <div data-testid="mastery-display" className="grid gap-3">
      {OPERATION_LABELS.map(({ key, icon }) => {
        const name = g.operations[key]
        const level = masteryLevels[key]
        const label = g.masteryLevels[level]
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
              {g.totalSuccess}: {total}
            </div>
            {prog ? (
              <div className="mt-1">
                <div
                  data-testid={`mastery-progress-${key}`}
                  className="h-2 w-full rounded bg-gray-200"
                  role="progressbar"
                  aria-label={`${name}${g.levelProgressLabel}`}
                  aria-valuenow={prog.current}
                  aria-valuemax={prog.nextThreshold}
                >
                  <div
                    className="h-2 rounded bg-green-500"
                    style={{ width: `${Math.min(100, (prog.current / prog.nextThreshold) * 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {g.nextLevel} {prog.remaining} / {g.threshold} {prog.nextThreshold}
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
