/**
 * Task 7（tasks.md）/ design.md §7 に基づく useGameLogic のゲーミフィケーション拡張の契約テスト。
 *
 * 現状の useGameLogic は useOperationStats / useGamification を未参照のため、
 * 多くの検証は TDD の「Red」として失敗する（実装追加後に Green になる想定）。
 *
 * テスト観点表（抜粋）
 * | Case ID | Input | Expected |
 * |---------|-------|----------|
 * | T7-1 | 成功操作 | recordSuccess(action) |
 * | T7-1b | 不正操作（得点0） | recordFailure(action) |
 * | T7-2 | タイマー終了 | calculateStarRating / commitSession |
 * | T7-3 | 連続5回成功 | ボーナスフルーツ追加 |
 */

import { renderHook, act } from '@testing-library/react'
import type { Fruit } from '@/types/game'
import { createDefaultCumulativeStats, createEmptySessionStats } from '@/lib/gamificationManager'

/** テスト内のみ: 収穫操作の成否を決定的にする（実装ファイルは変更しない） */
let nextAppleId = 10_000
jest.mock('@/lib/gameLogic', () => {
  const actual = jest.requireActual<typeof import('@/lib/gameLogic')>('@/lib/gameLogic')
  const makeApple = () => ({
    id: nextAppleId++,
    type: 'apple' as const,
    size: 'medium' as const,
    x: 50,
    y: 50,
    dx: 0,
    dy: 0,
  })
  return {
    ...actual,
    generateFruits: (count: number) => Array.from({ length: count }, () => makeApple()),
    generateFruit: () => makeApple(),
  }
})

const mockRecordSuccess = jest.fn()
const mockRecordFailure = jest.fn()
const mockResetSession = jest.fn()

const mockCalculateStarRating = jest.fn(() => 2 as 0 | 1 | 2 | 3)
const mockCommitSession = jest.fn()
const mockClearNewBadge = jest.fn()

jest.mock('../useOperationStats', () => ({
  useOperationStats: jest.fn(() => ({
    sessionStats: createEmptySessionStats(),
    streak: 0,
    lastStreakBonus: null,
    recordSuccess: mockRecordSuccess,
    recordFailure: mockRecordFailure,
    resetSession: mockResetSession,
    getLatestSessionStats: jest.fn(() => createEmptySessionStats()),
  })),
}))

jest.mock('../useGamification', () => ({
  useGamification: jest.fn(() => ({
    stageStars: {},
    earnedBadges: [],
    badgeProgress: {},
    cumulativeStats: createDefaultCumulativeStats(),
    lastSessionStats: null,
    newlyEarnedBadge: null,
    calculateStarRating: mockCalculateStarRating,
    commitSession: mockCommitSession,
    clearNewBadge: mockClearNewBadge,
    isHydrated: true,
  })),
}))

// モジュール解決を確実にする（実装で useGameLogic が import したときモックが効く）
void jest.requireMock('../useOperationStats')
void jest.requireMock('../useGamification')

import { useGameLogic } from '../useGameLogic'

describe('useGameLogic gamification (Task 7)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCalculateStarRating.mockReturnValue(2)
    jest.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  describe('Task 7.1: handleFruitInteraction と recordSuccess / recordFailure', () => {
    it('成功操作時に recordSuccess が呼ばれる（統合後）', () => {
      // Given: ゲームプレイ中
      // When: 正しい操作で収穫
      // Then: recordSuccess(action)
      const { result } = renderHook(() => useGameLogic())
      act(() => {
        result.current.startGame()
      })

      const apple = result.current.fruits.find(f => f.type === 'apple')
      expect(apple).toBeDefined()

      act(() => {
        result.current.handleFruitInteraction(apple as Fruit, 'click')
      })

      expect(mockRecordSuccess).toHaveBeenCalledWith('click')
    })

    it('得点0の不正操作時に recordFailure が呼ばれる（統合後）', () => {
      // Given: プレイ中 / When: 得点0の操作 / Then: recordFailure(action)
      const { result } = renderHook(() => useGameLogic())
      act(() => {
        result.current.startGame()
      })

      const apple = result.current.fruits.find(f => f.type === 'apple')
      expect(apple).toBeDefined()

      // When: りんごにダブルクリック（得点0）
      act(() => {
        result.current.handleFruitInteraction(apple as Fruit, 'doubleClick')
      })

      // Then: recordFailure（design §7.1 / calculateScore===0）
      expect(mockRecordFailure).toHaveBeenCalledWith('doubleClick')
    })
  })

  describe('Task 7.2: ゲーム終了時の星評価と commitSession', () => {
    it('タイマー終了時に calculateStarRating と commitSession が呼ばれる（統合後）', () => {
      // Given: プレイ中 / When: タイマー0 / Then: design §7.2
      const { result } = renderHook(() => useGameLogic())

      act(() => {
        result.current.startGame()
      })

      const timeLeft = result.current.timeLeft

      // When: 残り時間を0まで進める
      act(() => {
        jest.advanceTimersByTime(timeLeft * 1000)
      })

      // Then: アイドルに戻る
      expect(result.current.gameState).toBe('idle')

      // Then: design §7.2 — 星算出と commitSession
      expect(mockCalculateStarRating).toHaveBeenCalled()
      expect(mockCommitSession).toHaveBeenCalled()
    })
  })

  describe('Task 7.3: 5回連続成功でボーナスフルーツ', () => {
    // Task 9.3: recordSuccess は新 streak（number）を返す。jest.fn() の undefined だと newStreak === 5 が成立しないため、
    // 呼び出し回数に応じた streak のみこのブロックでモックする（7.1 / 7.2 には影響しない）。
    let streakCounter = 0
    beforeEach(() => {
      streakCounter = 0
      mockRecordSuccess.mockImplementation(() => ++streakCounter)
    })

    it('5回連続成功後にフルーツが追加される（ボーナス、統合後）', () => {
      // Given: プレイ中 / When: 連続成功×5 / Then: recordSuccess×5 かつ fruits +1（design §7.3）
      const { result } = renderHook(() => useGameLogic())

      act(() => {
        result.current.startGame()
      })

      const initialLen = result.current.fruits.length

      // When: りんごを正しく5回（連続成功）
      for (let i = 0; i < 5; i++) {
        const apple = result.current.fruits.find(f => f.type === 'apple')
        if (!apple) break
        act(() => {
          result.current.handleFruitInteraction(apple, 'click')
        })
      }

      // Then: recordSuccess が5回（連続の記録）
      expect(mockRecordSuccess).toHaveBeenCalledTimes(5)

      // Then: design §7.3 — 5連続時はボーナスで fruits が1件多い（置換ループを超える）
      expect(result.current.fruits.length).toBe(initialLen + 1)
    })
  })
})
