'use client'

import React from 'react'
import { BADGE_DEFINITIONS, BadgeDefinition, BadgeType, CumulativeOperationStats } from '@/types/gamification'

export interface BadgeDisplayProps {
  earnedBadges: BadgeType[]
  cumulativeStats: CumulativeOperationStats
  definitions?: BadgeDefinition[]
}

export function BadgeDisplay({
  earnedBadges,
  cumulativeStats,
  definitions = BADGE_DEFINITIONS,
}: BadgeDisplayProps): React.ReactElement {
  return (
    <div data-testid="badge-display" className="grid gap-3">
      {definitions.map(def => {
        const current = cumulativeStats[def.requiredAction].totalSuccess
        const target = def.threshold
        const earned = earnedBadges.includes(def.type)
        return (
          <div
            key={def.type}
            data-testid={`badge-row-${def.type}`}
            className="rounded border p-3"
            aria-label={def.name}
          >
            <div className="flex items-center gap-2 font-semibold">
              <span aria-hidden>{def.icon}</span>
              <span>{def.name}</span>
              {earned && <span data-testid={`badge-earned-${def.type}`}>獲得済み</span>}
            </div>
            <div
              className="mt-2 text-sm text-gray-600"
              data-testid={`badge-progress-${def.type}`}
              aria-label={`progress-${def.type}`}
            >
              {current} / {target}
            </div>
            <div className="mt-1 h-2 w-full rounded bg-gray-200" role="progressbar" aria-valuenow={current} aria-valuemax={target}>
              <div
                className="h-2 rounded bg-blue-500"
                style={{
                  width: `${target === 0 ? 0 : Math.min(100, (current / target) * 100)}%`,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
