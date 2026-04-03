/**
 * Task 10.4 / design.md §10.4 — 操作別熟達レベル一覧
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
import { MasteryDisplay } from '@/components/game/MasteryDisplay'
import type { OperationMasteryData } from '@/types/gamification'

const OPERATIONS: InteractionType[] = ['click', 'doubleClick', 'rightClick', 'drop']

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
