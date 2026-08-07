'use client'

import React from 'react'
import { BADGE_DEFINITIONS, BadgeDefinition, BadgeType, CumulativeOperationStats } from '@/types/gamification'
import { translations } from '@/lib/i18n/translations'

export interface BadgeDisplayProps {
  earnedBadges: BadgeType[]
  cumulativeStats: CumulativeOperationStats
  definitions?: BadgeDefinition[]
  /** 表示言語。省略時は日本語（既定の表示言語） */
  t?: typeof translations.ja
}

export function BadgeDisplay({
  earnedBadges,
  cumulativeStats,
  definitions = BADGE_DEFINITIONS,
  t = translations.ja,
}: BadgeDisplayProps): React.ReactElement {
  const g = t.gamification
  return (
    <div data-testid="badge-display" className="grid gap-3">
      {definitions.map(def => {
        const current = cumulativeStats[def.requiredAction].totalSuccess
        const target = def.threshold
        const earned = earnedBadges.includes(def.type)
        // def.name は日本語固定のデータなので、表示は辞書から引く
        const name = g.badges[def.type] ?? def.name
        return (
          <div
            key={def.type}
            data-testid={`badge-row-${def.type}`}
            className="rounded border p-3"
            aria-label={name}
          >
            <div className="flex items-center gap-2 font-semibold">
              <span aria-hidden>{def.icon}</span>
              <span>{name}</span>
              {earned && <span data-testid={`badge-earned-${def.type}`}>{g.badgeEarned}</span>}
            </div>
            <div
              className="mt-2 text-sm text-gray-600"
              data-testid={`badge-progress-${def.type}`}
              aria-label={`progress-${def.type}`}
            >
              {current} / {target}
            </div>
            <div
              className="mt-1 h-2 w-full rounded bg-gray-200"
              role="progressbar"
              aria-label={`${name}${g.badgeProgress}`}
              aria-valuenow={current}
              aria-valuemax={target}
            >
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
