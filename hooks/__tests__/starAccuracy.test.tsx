/**
 * Task 9（tasks.md）/ design.md §7.1a, §7.2a, §7.3
 * 星評価・操作統計の正確性に関するテスト。
 *
 * テスト観点表（抜粋）
 * | Case ID | Input / Precondition | Perspective | Expected | Notes |
 * |---------|----------------------|-------------|----------|-------|
 * | TC-9.1a | クリア即終了・timeLeft>0 | AC-1.1a | commitSession が残り時間付きで呼ばれる | 統合後 Green |
 * | TC-9.1b | 残り時間十分・ミス低 | §7.2a | ★2/★3 取得可能 | lib 検証 |
 * | TC-9.2a | 非レモンに右クリック | AC-5.2a | onFruitClick(..., 'rightClick') | GamePlayArea |
 * | TC-9.2b | スイカをドロップ領域外へリリース | AC-5.2a | onFruitClick(watermelon, 'drop') | 失敗パス |
 * | TC-9.3a | recordSuccess 呼び出し | §7.3 | 戻り値が新 streak | useOperationStats |
 * | TC-9.3b | 5連続成功 | §7.3 | 戻り値でボーナス判定（ref 廃止） | useGameLogic |
 */

import React, { createRef } from 'react'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import {
  calculateStarRating,
  createEmptySessionStats,
} from '@/lib/gamificationManager'
import { DEFAULT_STAR_CRITERIA } from '@/types/gamification'
import type { Fruit } from '@/types/game'
import { GamePlayArea } from '@/components/game/GamePlayArea'
import { useOperationStats } from '../useOperationStats'

let nextAppleId = 20_000
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

const mockCheckStageCompletion = jest.fn(() => false)

jest.mock('../useStage', () => ({
  useStage: jest.fn(() => ({
    currentStage: 1,
    currentStageInfo: {
      number: 1,
      name: 'S1',
      description: '',
      targetScore: 100,
      targetFruits: { total: 10 },
      timeLimit: 60,
      unlocked: true,
      completed: false,
      highScore: 0,
      difficulty: { fruitCount: 8, fruitSpeed: 1, powerUpSpawnRate: 0.1 },
    },
    completedStages: [] as number[],
    totalScore: 0,
    allStages: [],
    checkStageCompletion: (...a: unknown[]) => mockCheckStageCompletion(...a),
    nextStage: jest.fn(() => false),
    selectStage: jest.fn(() => false),
    reset: jest.fn(),
    isHydrated: true,
  })),
}))

const mockCalculateStarRating = jest.fn(() => 2 as 0 | 1 | 2 | 3)
const mockCommitSession = jest.fn()

jest.mock('../useGamification', () => {
  const { createDefaultCumulativeStats } = require('@/lib/gamificationManager')
  return {
    useGamification: jest.fn(() => ({
      stageStars: {},
      earnedBadges: [],
      badgeProgress: {},
      cumulativeStats: createDefaultCumulativeStats(),
      lastSessionStats: null,
      previousSessionStats: null,
      newlyEarnedBadge: null,
      calculateStarRating: mockCalculateStarRating,
      commitSession: mockCommitSession,
      clearNewBadge: jest.fn(),
      isHydrated: true,
    })),
  }
})

import { useGameLogic } from '../useGameLogic'

describe('starAccuracy (Task 9)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCheckStageCompletion.mockReturnValue(false)
    mockCalculateStarRating.mockImplementation(() => 2)
  })

  describe('Task 9.1: ステージクリア即終了・星評価（AC-1.1a / §7.2a）', () => {
    it('ステージクリア条件達成時にゲームが即 idle になり、残り時間>0 のまま commitSession が呼ばれる（実装後）', () => {
      // Given: プレイ中でクリア条件を満たすと checkStageCompletion が true になる想定
      mockCheckStageCompletion.mockReturnValue(true)

      const { result } = renderHook(() => useGameLogic())

      act(() => {
        result.current.startGame()
      })

      const apple = result.current.fruits.find(f => f.type === 'apple')
      expect(apple).toBeDefined()

      // When: 収穫してクリア達成（§7.2a: handleFruitInteraction 後に評価→即終了）
      act(() => {
        result.current.handleFruitInteraction(apple as Fruit, 'click')
      })

      // Then: 即終了（タイマー0待ちではない）かつ commitSession が呼ばれ、星算出に残り時間が使われる
      expect(result.current.gameState).toBe('idle')
      expect(result.current.timeLeft).toBeGreaterThan(0)
      expect(mockCommitSession).toHaveBeenCalled()
      const starCall = mockCalculateStarRating.mock.calls.find(
        c => typeof c[2] === 'number' && (c[2] as number) > 0
      )
      expect(starCall).toBeDefined()
    })

    it('クリア即終了時の星評価は残り時間を反映し star2/star3 が取り得る（lib）', () => {
      // Given: クリア済み・残り時間 45/60・ミスなし
      const stats = createEmptySessionStats()
      stats.click.success = 5

      // When / Then: 残り時間比率 >= 0.2 → ★2、ミス率条件で ★3
      const stars = calculateStarRating(true, 45, 60, stats, DEFAULT_STAR_CRITERIA)
      expect(stars).toBeGreaterThanOrEqual(2)
      expect(stars).toBe(3)
    })
  })

  describe('Task 9.2: GamePlayArea 右クリック・ドロップ失敗（AC-5.2a / §7.1a）', () => {
    const baseFruit = (f: Partial<Fruit> & Pick<Fruit, 'id' | 'type'>): Fruit => ({
      size: 'medium',
      x: 20,
      y: 20,
      dx: 0,
      dy: 0,
      ...f,
    })

    function renderArea(fruits: Fruit[], onFruitClick = jest.fn()) {
      const ref = createRef<HTMLDivElement>()
      const view = render(
        <GamePlayArea
          fruits={fruits}
          powerUps={[]}
          particles={[]}
          isHardMode={false}
          selectedFruitIndex={-1}
          onFruitClick={onFruitClick}
          onPowerUpCollect={jest.fn()}
          onTriggerAnimation={jest.fn()}
          onFruitCollected={jest.fn()}
          gameAreaRef={ref}
        />
      )
      return { onFruitClick, ref, ...view }
    }

    it('レモン以外への右クリックで onFruitClick(fruit, "rightClick") が呼ばれ失敗記録に繋がる（§7.1a）', () => {
      const apple = baseFruit({ id: 101, type: 'apple' })
      const onFruitClick = jest.fn()
      renderArea([apple], onFruitClick)

      const node = screen.getByTestId('game-area').querySelector('[data-fruit-id="101"]')
      expect(node).toBeTruthy()

      // When: りんごへ右クリック（不正操作）
      fireEvent.mouseDown(node!, { button: 2 })

      // Then: design §7.1a — handleFruitInteraction に rightClick が伝わり recordFailure('rightClick')
      expect(onFruitClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'apple' }), 'rightClick')
    })

    it('スイカをドロップ領域外にリリースすると onFruitClick(fruit, "drop") が呼ばれ失敗記録に繋がる（§7.1a）', () => {
      // Given: ドラッグ開始はスイカのみ可能（他フルーツは drop 操作が発生しない）
      const watermelon = baseFruit({ id: 202, type: 'watermelon' })
      const onFruitClick = jest.fn()
      renderArea([watermelon], onFruitClick)

      const gameArea = screen.getByTestId('game-area')
      const node = gameArea.querySelector('[data-fruit-id="202"]')
      expect(node).toBeTruthy()

      const dropArea = gameArea.querySelector('.drop-area')
      const dropRect = dropArea!.getBoundingClientRect()
      const areaRect = gameArea.getBoundingClientRect()

      // When: スイカをドラッグし、ドロップ領域外（左側）でリリース → calculateScore===0 相当の失敗パス
      fireEvent.mouseDown(node!, { button: 0 })
      fireEvent.mouseMove(gameArea, { clientX: areaRect.left + 80, clientY: areaRect.top + 80 })
      fireEvent.mouseUp(gameArea, {
        clientX: dropRect.left - 20,
        clientY: (dropRect.top + dropRect.bottom) / 2,
      })

      // Then: design §7.1a — 領域外 drop が伝わり recordFailure('drop')
      expect(onFruitClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'watermelon', id: 202 }), 'drop')
    })
  })

  describe('Task 9.3: recordSuccess の戻り値とボーナス判定（§7.3）', () => {
    it('recordSuccess の戻り値として新しい streak が返る', () => {
      const { result } = renderHook(() => useOperationStats())

      let ret: unknown
      act(() => {
        ret = result.current.recordSuccess('click')
      })

      // Then: design §7.3 — 戻り値は更新後の streak（現在は void のため実装後に Green）
      expect(typeof ret).toBe('number')
      expect(ret).toBe(1)
    })

    it('useGameLogic は recordSuccess の戻り値でボーナスフルーツを判定し successStreakRef に依存しない（実装後）', () => {
      const { result } = renderHook(() => useGameLogic())

      act(() => {
        result.current.startGame()
      })

      const initialLen = result.current.fruits.length

      for (let i = 0; i < 5; i++) {
        const apple = result.current.fruits.find(f => f.type === 'apple')
        expect(apple).toBeDefined()
        act(() => {
          result.current.handleFruitInteraction(apple as Fruit, 'click')
        })
      }

      // Then: 5 連続成功でボーナス 1 体。実装が戻り値ベースのとき、recordSuccess の戻り値と整合
      expect(result.current.fruits.length).toBe(initialLen + 1)
    })
  })
})
