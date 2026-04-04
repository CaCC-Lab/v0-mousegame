/**
 * Task 12 / design.md §13 — CollectionModal
 * AC-9.1〜9.7, CP-13
 *
 * テスト観点表（抜粋）
 * | Case ID | Perspective | Expected |
 * |---------|-------------|----------|
 * | TC-AC-9.1 | open | モーダル表示 |
 * | TC-AC-9.2 | フルーツタブ | 4種・累計・コンプリート |
 * | TC-AC-9.3 | バッジタブ | 獲得/未獲得 |
 * | TC-AC-9.4 | じゅくたつタブ | 4操作レベル・進捗 |
 * | TC-AC-9.5 | れんしゅうタブ | 連続日・30日カレンダー |
 * | TC-9.6 | 閉じる | onClose |
 * | TC-CP-13 | 導出 | localStorage 非依存（表示専用） |
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { BadgeType, DateString, OperationMasteryData } from '@/types/gamification'
import type { HarvestedFruits, InteractionType } from '@/types/game'
import { CollectionModal } from '@/components/game/CollectionModal'

type MasteryProgress = {
  [K in InteractionType]: { current: number; nextThreshold: number; remaining: number } | null
}

function baseMasteryProgress(): MasteryProgress {
  return {
    click: { current: 5, nextThreshold: 10, remaining: 5 },
    doubleClick: { current: 0, nextThreshold: 10, remaining: 10 },
    rightClick: null,
    drop: { current: 2, nextThreshold: 10, remaining: 8 },
  }
}

function baseMasteryLevels(): OperationMasteryData {
  return { click: 2, doubleClick: 1, rightClick: 1, drop: 1 }
}

function baseHarvested(): HarvestedFruits {
  return { apple: 10, blueberry: 5, lemon: 3, watermelon: 1 }
}

describe('CollectionModal (Task 12 / design §13)', () => {
  const defaultProps = () => ({
    open: true,
    onClose: jest.fn(),
    cumulativeStats: {
      click: { totalSuccess: 5, totalFail: 0 },
      doubleClick: { totalSuccess: 0, totalFail: 0 },
      rightClick: { totalSuccess: 0, totalFail: 0 },
      drop: { totalSuccess: 2, totalFail: 0 },
    },
    harvestedFruits: baseHarvested(),
    earnedBadges: ['clickMaster'] as BadgeType[],
    masteryLevels: baseMasteryLevels(),
    masteryProgress: baseMasteryProgress(),
    stamps: ['2026-01-01', '2026-01-02'] as DateString[],
    practiceStreak: 4,
  })

  beforeEach(() => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('AC-9.1 / AC-9.6: open=true でモーダルが表示され、閉じるで onClose が呼ばれる', async () => {
    // Given
    const onClose = jest.fn()
    const user = userEvent.setup()
    // When
    render(<CollectionModal {...defaultProps()} onClose={onClose} />)
    // Then: モーダルとして表示
    expect(screen.getByTestId('collection-modal')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')

    await user.click(screen.getByTestId('collection-modal-close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('AC-9.1: open=false のときモーダルが描画されない', () => {
    render(<CollectionModal {...defaultProps()} open={false} />)
    expect(screen.queryByTestId('collection-modal')).not.toBeInTheDocument()
  })

  it('AC-9.2: フルーツタブに4種類・累計収穫数・条件付きコンプリート表示', async () => {
    const user = userEvent.setup()
    const harvested = { apple: 1, blueberry: 2, lemon: 3, watermelon: 4 }
    render(
      <CollectionModal
        {...defaultProps()}
        harvestedFruits={harvested}
      />
    )

    await user.click(screen.getByTestId('collection-tab-fruits'))
    expect(screen.getByTestId('collection-panel-fruits')).toBeInTheDocument()
    expect(screen.getByTestId('collection-fruit-apple')).toHaveAttribute('data-harvest-count', '1')
    expect(screen.getByTestId('collection-fruit-count-watermelon')).toHaveTextContent('4')
    expect(screen.getByTestId('collection-fruit-name-lemon')).toHaveTextContent('レモン')
    expect(screen.getByTestId('collection-fruits-complete')).toBeInTheDocument()
  })

  it('AC-9.3: バッジタブで獲得済みと未獲得（シルエット）を区別', async () => {
    const user = userEvent.setup()
    render(<CollectionModal {...defaultProps()} earnedBadges={['clickMaster']} />)

    await user.click(screen.getByTestId('collection-tab-badges'))
    expect(screen.getByTestId('collection-badge-clickMaster')).toHaveAttribute('data-earned', 'true')
    expect(screen.getByTestId('collection-badge-dragDoctor')).toHaveAttribute('data-earned', 'false')
    expect(screen.getByTestId('collection-badge-dragDoctor')).toHaveClass('collection-badge-silhouette')
  })

  it('AC-9.4: じゅくたつタブに4操作のレベルと累計成功（current）が表示される', async () => {
    const user = userEvent.setup()
    render(<CollectionModal {...defaultProps()} />)

    await user.click(screen.getByTestId('collection-tab-mastery'))
    expect(screen.getByTestId('collection-mastery-level-click')).toHaveTextContent('Lv.2')
    expect(screen.getByTestId('collection-mastery-current-click')).toHaveTextContent('5')
    expect(screen.getByTestId('collection-mastery-rightClick')).toBeInTheDocument()
  })

  it('AC-9.5: れんしゅうタブに連続日数と30日分スタンプグリッド', async () => {
    const user = userEvent.setup()
    render(<CollectionModal {...defaultProps()} practiceStreak={7} />)

    await user.click(screen.getByTestId('collection-tab-practice'))
    expect(screen.getByTestId('collection-practice-streak')).toHaveTextContent('7')
    expect(screen.getByTestId('collection-stamp-calendar')).toBeInTheDocument()
    expect(screen.getByTestId('collection-stamp-day-0')).toBeInTheDocument()
    expect(screen.getByTestId('collection-stamp-day-29')).toBeInTheDocument()
  })

  it('タブ切り替えでパネルが切り替わる', async () => {
    const user = userEvent.setup()
    render(<CollectionModal {...defaultProps()} />)

    await user.click(screen.getByTestId('collection-tab-badges'))
    expect(screen.getByTestId('collection-panel-badges')).toBeInTheDocument()
    expect(screen.queryByTestId('collection-panel-fruits')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('collection-tab-fruits'))
    expect(screen.getByTestId('collection-panel-fruits')).toBeInTheDocument()
  })

  it('CP-13: 図鑑表示が props から導出され、localStorage を読まない', () => {
    const getItem = jest.spyOn(Storage.prototype, 'getItem')
    const props = defaultProps()
    render(<CollectionModal {...props} />)
    expect(screen.getByTestId('collection-fruit-count-apple')).toHaveTextContent(String(props.harvestedFruits.apple))
    expect(getItem).not.toHaveBeenCalled()
  })

  it('AC-9.7 / CP-13: 同一 props から同一のフルーツ表示が導出される', () => {
    const props = defaultProps()
    const { unmount } = render(<CollectionModal {...props} />)
    const first = screen.getByTestId('collection-fruit-count-apple').textContent
    unmount()
    render(<CollectionModal {...props} />)
    expect(screen.getByTestId('collection-fruit-count-apple')).toHaveTextContent(first ?? '')
  })
})
