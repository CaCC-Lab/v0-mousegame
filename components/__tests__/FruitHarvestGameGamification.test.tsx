/**
 * Task 8（tasks.md）/ design.md §7 に基づく FruitHarvestGame のゲーミフィケーション統合の契約テスト。
 *
 * 現状の FruitHarvestGame は useGamification / useOperationStats および
 * ResultModal / BadgeNotification / StreakIndicator / BadgeDisplay を未統合のため、
 * 多くの検証は失敗する（実装後に Green になる想定）。
 *
 * テスト観点表（抜粋）
 * | Case ID | Perspective | Expected |
 * |---------|-------------|----------|
 * | T8-1 | フック統合 | useGamification / useOperationStats 呼び出し |
 * | T8-2 | 終了UI | ResultModal（dialog） |
 * | T8-3 | バッジ演出 | BadgeNotification |
 * | T8-4 | レイアウト | GamePlayArea 内に StreakIndicator |
 * | T8-5 | アイドル | BadgeDisplay |
 *
 * テスト観点表（詳細）
 * | Case ID | Input / Precondition | Perspective | Expected Result | Notes |
 * |---------|----------------------|-------------|-----------------|-------|
 * | TC-N-01 | マウント | Equivalence | 両フック呼び出し | 8.1 |
 * | TC-N-02 | アイドル表示 | Equivalence | BadgeDisplay 可視 | 8.5 |
 * | TC-A-01 | 未統合 | 異常 | 要素なしで失敗（TDD Red） | 実装後 |
 */

import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { FruitHarvestGame } from '../FruitHarvestGame'

jest.mock('@/hooks/useGamification', () => {
  const { createDefaultCumulativeStats } = require('@/lib/gamificationManager')
  const { BADGE_DEFINITIONS } = require('@/types/gamification')
  return {
    useGamification: jest.fn(() => ({
      stageStars: {},
      earnedBadges: [],
      badgeProgress: {},
      cumulativeStats: createDefaultCumulativeStats(),
      lastSessionStats: null,
      newlyEarnedBadge: BADGE_DEFINITIONS[0],
      calculateStarRating: jest.fn(() => 2),
      commitSession: jest.fn(),
      clearNewBadge: jest.fn(),
      isHydrated: true,
    })),
  }
})

jest.mock('@/hooks/useOperationStats', () => ({
  useOperationStats: jest.fn(() => ({
    sessionStats: {
      click: { success: 0, fail: 0 },
      doubleClick: { success: 0, fail: 0 },
      rightClick: { success: 0, fail: 0 },
      drop: { success: 0, fail: 0 },
    },
    streak: 0,
    lastStreakBonus: null,
    recordSuccess: jest.fn(),
    recordFailure: jest.fn(),
    resetSession: jest.fn(),
  })),
}))

import { useGamification } from '@/hooks/useGamification'
import { useOperationStats } from '@/hooks/useOperationStats'

const mockUseGamification = useGamification as jest.MockedFunction<typeof useGamification>
const mockUseOperationStats = useOperationStats as jest.MockedFunction<typeof useOperationStats>

describe('FruitHarvestGame gamification (Task 8)', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('Task 8.1: useGamification と useOperationStats の統合', () => {
    it('マウント時に useGamification が呼ばれる（統合後）', () => {
      // Given / When: アプリをマウント
      render(<FruitHarvestGame />)

      // Then: design §8.1
      expect(mockUseGamification).toHaveBeenCalled()
    })

    it('マウント時に useOperationStats が呼ばれる（統合後）', () => {
      render(<FruitHarvestGame />)

      expect(mockUseOperationStats).toHaveBeenCalled()
    })
  })

  describe('Task 8.2: ゲーム終了時に ResultModal', () => {
    it('結果画面のダイアログが表示される（統合後・ゲーム終了時）', () => {
      // Given: ゲーム終了フロー完了後（実装後） / When: レンダー
      render(<FruitHarvestGame />)

      // Then: ResultModal — aria-labelledby="result-modal-title" の見出しテキスト
      expect(
        screen.queryByRole('dialog', { name: /れんしゅうけっか/ })
      ).toBeTruthy()
    })
  })

  describe('Task 8.3: バッジ獲得時に BadgeNotification', () => {
    it('祝福演出が表示される（統合後・newlyEarnedBadge あり）', () => {
      render(<FruitHarvestGame />)

      // Then: BadgeNotification の data-testid（コンポーネント契約）
      expect(screen.queryByTestId('badge-notification')).toBeTruthy()
    })
  })

  describe('Task 8.4: StreakIndicator を GamePlayArea 内に配置', () => {
    it('game-area 内に StreakIndicator（連続カウント）がある', () => {
      render(<FruitHarvestGame />)

      const gameArea = screen.getByTestId('game-area')
      expect(
        within(gameArea).queryByTestId('streak-count')
      ).toBeTruthy()
    })
  })

  describe('Task 8.5: アイドル時に BadgeDisplay', () => {
    it('初期表示（アイドル）でバッジ一覧が表示される', () => {
      render(<FruitHarvestGame />)

      // Then: BadgeDisplay の data-testid
      expect(screen.queryByTestId('badge-display')).toBeTruthy()
    })
  })
})
