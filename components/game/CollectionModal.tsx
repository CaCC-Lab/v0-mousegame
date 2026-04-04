'use client'

import React, { useState } from 'react'
import { BADGE_DEFINITIONS } from '@/types/gamification'
import type { BadgeType, CumulativeOperationStats, DateString, OperationMasteryData } from '@/types/gamification'
import type { HarvestedFruits, InteractionType } from '@/types/game'
import { Button } from '@/components/ui/button'

type MasteryProgress = {
  [K in InteractionType]: { current: number; nextThreshold: number; remaining: number } | null
}

const FRUITS = [
  { key: 'apple' as const, name: 'りんご', emoji: '🍎' },
  { key: 'blueberry' as const, name: 'ブルーベリー', emoji: '🫐' },
  { key: 'lemon' as const, name: 'レモン', emoji: '🍋' },
  { key: 'watermelon' as const, name: 'スイカ', emoji: '🍉' },
] as const

const OPERATIONS: { key: InteractionType; name: string }[] = [
  { key: 'click', name: 'クリック' },
  { key: 'doubleClick', name: 'ダブルクリック' },
  { key: 'rightClick', name: '右クリック' },
  { key: 'drop', name: 'ドラッグ' },
]

type TabId = 'fruits' | 'badges' | 'mastery' | 'practice'

const TABS: { id: TabId; label: string }[] = [
  { id: 'fruits', label: 'フルーツ' },
  { id: 'badges', label: 'バッジ' },
  { id: 'mastery', label: 'じゅくたつ' },
  { id: 'practice', label: 'れんしゅう' },
]

export interface CollectionModalProps {
  open: boolean
  onClose: () => void
  cumulativeStats: CumulativeOperationStats
  /** 累計収穫数（cumulativeStatsから導出推奨） */
  harvestedFruits: HarvestedFruits
  earnedBadges: BadgeType[]
  masteryLevels: OperationMasteryData
  masteryProgress: MasteryProgress
  stamps: DateString[]
  practiceStreak: number
}

export function CollectionModal({
  open,
  onClose,
  cumulativeStats,
  harvestedFruits,
  earnedBadges,
  masteryLevels,
  masteryProgress,
  stamps,
  practiceStreak,
}: CollectionModalProps): React.ReactElement | null {
  const [tab, setTab] = useState<TabId>('fruits')

  if (!open) return null

  const allFruitsHarvested = FRUITS.every(f => harvestedFruits[f.key] > 0)
  const stampSet = new Set(stamps)

  return (
    <div data-testid="collection-modal" role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">ずかん</h2>
          <Button data-testid="collection-modal-close" onClick={onClose} variant="outline" size="sm">
            閉じる
          </Button>
        </div>

        <div data-testid="collection-tabs" role="tablist" className="flex gap-1 mb-4 border-b pb-2">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              data-testid={`collection-tab-${t.id}`}
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-t text-sm font-semibold ${tab === t.id ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'fruits' && (
          <div data-testid="collection-panel-fruits" role="tabpanel" className="space-y-3">
            {FRUITS.map(f => (
              <div key={f.key} data-testid={`collection-fruit-${f.key}`} data-harvest-count={harvestedFruits[f.key]} className="flex items-center gap-3 p-3 rounded border">
                <span data-testid={`collection-fruit-emoji-${f.key}`} className="text-3xl">{f.emoji}</span>
                <span data-testid={`collection-fruit-name-${f.key}`} className="font-semibold">{f.name}</span>
                <span data-testid={`collection-fruit-count-${f.key}`} className="ml-auto text-lg font-bold">{harvestedFruits[f.key]}</span>
              </div>
            ))}
            {allFruitsHarvested && (
              <div data-testid="collection-fruits-complete" className="text-center text-green-600 font-bold text-lg py-2">
                コンプリート！
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
                  <span className="font-semibold">{def.name}</span>
                  {earned && <span className="ml-auto text-green-500">獲得済み</span>}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'mastery' && (
          <div data-testid="collection-panel-mastery" role="tabpanel" className="space-y-3">
            {OPERATIONS.map(({ key, name }) => {
              const prog = masteryProgress[key]
              return (
                <div key={key} data-testid={`collection-mastery-${key}`} className="p-3 rounded border">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{name}</span>
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
              <span className="text-sm text-gray-500">れんぞく</span>
              <div data-testid="collection-practice-streak" className="text-3xl font-bold text-blue-600">
                {practiceStreak}
              </div>
              <span className="text-sm text-gray-500">日</span>
            </div>
            <div data-testid="collection-stamp-calendar" aria-label="直近30日スタンプカレンダー" className="grid grid-cols-7 gap-1">
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
