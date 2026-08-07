'use client'

import { FruitSprite } from './FruitSprite'
import React, { useState } from 'react'
import { BADGE_DEFINITIONS } from '@/types/gamification'
import type { BadgeType, CumulativeOperationStats, DateString, OperationMasteryData } from '@/types/gamification'
import type { HarvestedFruits, InteractionType } from '@/types/game'
import { Button } from '@/components/ui/button'
import { translations } from '@/lib/i18n/translations'

type MasteryProgress = {
  [K in InteractionType]: { current: number; nextThreshold: number; remaining: number } | null
}

// 表示名は翻訳辞書から引くため、ここでは並び順とキーだけを持つ
const FRUIT_KEYS = ['apple', 'blueberry', 'lemon', 'watermelon'] as const

const OPERATION_KEYS: InteractionType[] = ['click', 'doubleClick', 'rightClick', 'drop']

type TabId = 'fruits' | 'badges' | 'mastery' | 'practice'

const TAB_IDS: TabId[] = ['fruits', 'badges', 'mastery', 'practice']

export interface CollectionModalProps {
  open: boolean
  onClose: () => void
  cumulativeStats: CumulativeOperationStats
  /** 累計収穫数。省略時はcumulativeStatsから導出 */
  harvestedFruits?: HarvestedFruits
  earnedBadges: BadgeType[]
  masteryLevels: OperationMasteryData
  masteryProgress: MasteryProgress
  stamps: DateString[]
  practiceStreak: number
  /** 表示言語。省略時は日本語（既定の表示言語） */
  t?: typeof translations.ja
}

export function CollectionModal({
  open,
  onClose,
  cumulativeStats,
  harvestedFruits,
  earnedBadges,
  masteryLevels,
  stamps,
  practiceStreak,
  t = translations.ja,
}: CollectionModalProps): React.ReactElement | null {
  const [tab, setTab] = useState<TabId>('fruits')
  const g = t.gamification
  const tabLabels: Record<TabId, string> = {
    fruits: g.tabFruits,
    badges: g.tabBadges,
    mastery: g.tabMastery,
    practice: g.tabPractice,
  }

  if (!open) return null

  const resolvedFruits: HarvestedFruits = harvestedFruits ?? {
    apple: cumulativeStats.click.totalSuccess,
    blueberry: cumulativeStats.doubleClick.totalSuccess,
    lemon: cumulativeStats.rightClick.totalSuccess,
    watermelon: cumulativeStats.drop.totalSuccess,
  }
  const allFruitsHarvested = FRUIT_KEYS.every(key => resolvedFruits[key] > 0)
  const stampSet = new Set(stamps)

  return (
    <div data-testid="collection-modal" role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{g.collectionTitle}</h2>
          <Button data-testid="collection-modal-close" onClick={onClose} variant="outline" size="sm">
            {t.close}
          </Button>
        </div>

        <div data-testid="collection-tabs" role="tablist" className="flex gap-1 mb-4 border-b pb-2">
          {TAB_IDS.map(id => (
            <button
              key={id}
              type="button"
              role="tab"
              data-testid={`collection-tab-${id}`}
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-t text-sm font-semibold ${tab === id ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tabLabels[id]}
            </button>
          ))}
        </div>

        {tab === 'fruits' && (
          <div data-testid="collection-panel-fruits" role="tabpanel" className="space-y-3">
            {FRUIT_KEYS.map(key => (
              <div key={key} data-testid={`collection-fruit-${key}`} data-harvest-count={resolvedFruits[key]} className="flex items-center gap-3 p-3 rounded border">
                <span data-testid={`collection-fruit-emoji-${key}`}><FruitSprite type={key} size={32} decorative /></span>
                <span data-testid={`collection-fruit-name-${key}`} className="font-semibold">{t[key]}</span>
                <span data-testid={`collection-fruit-count-${key}`} className="ml-auto text-lg font-bold">{resolvedFruits[key]}</span>
              </div>
            ))}
            {allFruitsHarvested && (
              <div data-testid="collection-fruits-complete" className="text-center text-green-600 font-bold text-lg py-2">
                {g.fruitsComplete}
              </div>
            )}
          </div>
        )}

        {tab === 'badges' && (
          <div data-testid="collection-panel-badges" role="tabpanel" className="space-y-3">
            {BADGE_DEFINITIONS.map(def => {
              const earned = earnedBadges.includes(def.type)
              return (
                <div
                  key={def.type}
                  data-testid={`collection-badge-${def.type}`}
                  data-earned={earned ? 'true' : 'false'}
                  className={earned ? 'collection-badge-earned flex items-center gap-3 p-3 rounded border' : 'collection-badge-silhouette flex items-center gap-3 p-3 rounded border opacity-40 grayscale'}
                >
                  <span className="text-2xl">{def.icon}</span>
                  <span className="font-semibold">{g.badges[def.type] ?? def.name}</span>
                  {earned && <span className="ml-auto text-green-500">{g.badgeEarned}</span>}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'mastery' && (
          <div data-testid="collection-panel-mastery" role="tabpanel" className="space-y-3">
            {OPERATION_KEYS.map(key => {
              return (
                <div key={key} data-testid={`collection-mastery-${key}`} className="p-3 rounded border">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{g.operations[key]}</span>
                    <span data-testid={`collection-mastery-level-${key}`} className="text-blue-600">Lv.{masteryLevels[key]}</span>
                  </div>
                  <div data-testid={`collection-mastery-current-${key}`} className="text-sm text-gray-500 mt-1">
                    {cumulativeStats[key].totalSuccess}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'practice' && (
          <div data-testid="collection-panel-practice" role="tabpanel">
            <div className="text-center mb-4">
              <span className="text-sm text-gray-500">{g.practiceStreakLabel}</span>
              <div data-testid="collection-practice-streak" className="text-3xl font-bold text-blue-600">
                {practiceStreak}
              </div>
              <span className="text-sm text-gray-500">{g.practiceDaysUnit}</span>
            </div>
            <div data-testid="collection-stamp-calendar" aria-label={g.stampCalendarLabel} className="grid grid-cols-7 gap-1">
              {Array.from({ length: 30 }, (_, i) => {
                const d = new Date()
                d.setDate(d.getDate() - (29 - i))
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                const stamped = stampSet.has(dateStr)
                return (
                  <span
                    key={i}
                    data-testid={`collection-stamp-day-${i}`}
                    data-stamped={stamped ? 'true' : 'false'}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${stamped ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}
                  >
                    {d.getDate()}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
