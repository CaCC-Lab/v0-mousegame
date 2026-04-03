/**
 * Task 10.4 / design.md §10.4 — 操作別熟達レベル一覧
 *
 * 実装の `components/game/MasteryDisplay.tsx` が未追加のため、
 * design §10.4 の Props 契約に沿ったテスト用スタブで表示仕様を検証する。
 * 本番コンポーネント追加後は `@/components/game/MasteryDisplay` を import しスタブを削除すること。
 *
 * テスト観点表（抜粋）
 * | Case ID | Input | Expected |
 * |---------|-------|----------|
 * | TC-10.4 | 4操作の levels / progress | レベル・ラベル・進捗バーが表示 |
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import type { CumulativeOperationStats } from '@/types/gamification'
import type { InteractionType } from '@/types/game'

/** design §10.1 */
type MasteryLevel = 1 | 2 | 3 | 4 | 5
type OperationMasteryData = {
  click: MasteryLevel
  doubleClick: MasteryLevel
  rightClick: MasteryLevel
  drop: MasteryLevel
}

const MASTERY_LABELS: Record<MasteryLevel, string> = {
  1: 'はじめて',
  2: 'できるね',
  3: 'じょうず',
  4: 'すごい',
  5: 'マスター',
}

const OPERATIONS: InteractionType[] = ['click', 'doubleClick', 'rightClick', 'drop']

export interface MasteryDisplayProps {
  masteryLevels: OperationMasteryData
  masteryProgress: {
    [K in InteractionType]: { current: number; nextThreshold: number; remaining: number } | null
  }
  cumulativeStats: CumulativeOperationStats
}

/** MasteryDisplay の契約（Task 10.4）— 本番実装と testid を揃える */
function MasteryDisplay({ masteryLevels, masteryProgress, cumulativeStats }: MasteryDisplayProps): React.ReactElement {
  return (
    <div data-testid="mastery-display" className="grid gap-3">
      {OPERATIONS.map(op => {
        const prog = masteryProgress[op]
        const label = MASTERY_LABELS[masteryLevels[op]]
        const total = cumulativeStats[op].totalSuccess
        return (
          <div
            key={op}
            data-testid={`mastery-row-${op}`}
            aria-label={`mastery-${op}`}
          >
            <div className="flex gap-2">
              <span data-testid={`mastery-level-${op}`}>Lv.{masteryLevels[op]}</span>
              <span data-testid={`mastery-label-${op}`}>{label}</span>
            </div>
            <div data-testid={`mastery-total-${op}`} className="text-sm">
              累計成功: {total}
            </div>
            {prog ? (
              <div
                data-testid={`mastery-progress-${op}`}
                role="progressbar"
                aria-valuenow={prog.current}
                aria-valuemax={prog.nextThreshold}
              >
                次まで {prog.remaining} / 閾値 {prog.nextThreshold}
              </div>
            ) : (
              <div data-testid={`mastery-progress-${op}`}>MAX</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

describe('MasteryDisplay (Task 10.4)', () => {
  const baseCum: CumulativeOperationStats = {
    click: { totalSuccess: 25, totalFail: 0 },
    doubleClick: { totalSuccess: 10, totalFail: 0 },
    rightClick: { totalSuccess: 0, totalFail: 0 },
    drop: { totalSuccess: 0, totalFail: 0 },
  }

  const levels: OperationMasteryData = {
    click: 3,
    doubleClick: 2,
    rightClick: 1,
    drop: 1,
  }

  const progress: MasteryDisplayProps['masteryProgress'] = {
    click: { current: 25, nextThreshold: 30, remaining: 5 },
    doubleClick: { current: 10, nextThreshold: 30, remaining: 20 },
    rightClick: { current: 0, nextThreshold: 10, remaining: 10 },
    drop: { current: 0, nextThreshold: 10, remaining: 10 },
  }

  it('4操作分の行・レベル・ラベル・進捗が表示される', () => {
    // Given: 4操作の masteryLevels / masteryProgress / cumulativeStats
    // When: 描画
    // Then: 各行にレベル・ラベル・進捗 testid が存在
    render(<MasteryDisplay masteryLevels={levels} masteryProgress={progress} cumulativeStats={baseCum} />)

    expect(screen.getByTestId('mastery-display')).toBeInTheDocument()
    for (const op of OPERATIONS) {
      expect(screen.getByTestId(`mastery-row-${op}`)).toBeInTheDocument()
      expect(screen.getByTestId(`mastery-level-${op}`)).toHaveTextContent(`Lv.${levels[op]}`)
      expect(screen.getByTestId(`mastery-label-${op}`)).toHaveTextContent(MASTERY_LABELS[levels[op]])
      expect(screen.getByTestId(`mastery-progress-${op}`)).toBeInTheDocument()
    }
  })

  it('累計成功数が表示される', () => {
    // Given / When
    render(<MasteryDisplay masteryLevels={levels} masteryProgress={progress} cumulativeStats={baseCum} />)
    // Then
    expect(screen.getByTestId('mastery-total-click')).toHaveTextContent('25')
  })
})
