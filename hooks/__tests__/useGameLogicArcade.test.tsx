/**
 * Issue #42: アーケードモード（60秒スコアアタック）の契約テスト。
 *
 * 既存の練習モード（ステージ制）を壊さないことも同時に確かめる。
 *
 * | Case ID | Input | Expected |
 * |---------|-------|----------|
 * | A-1 | 既定 | mode は 'practice' |
 * | A-2 | startGame('arcade') | 60秒・固定フルーツ数 |
 * | A-3 | 連続収穫 | コンボ倍率がスコアに乗る |
 * | A-4 | 誤操作 | コンボが切れる |
 * | A-5 | 大量収穫 | ステージクリアで中断されない |
 * | A-6 | 時間切れ | arcadeResult（自己ベスト・段位）が出る |
 * | A-7 | 練習モード | 従来どおり倍率は乗らない |
 */

import { renderHook, act } from '@testing-library/react'
import type { Fruit } from '@/types/game'
import { ARCADE_CONFIG } from '@/types/arcade'

/** テスト内のみ: 収穫操作の成否を決定的にする（実装ファイルは変更しない） */
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

import { useGameLogic } from '../useGameLogic'

function harvestApple(result: { current: ReturnType<typeof useGameLogic> }): void {
  const apple = result.current.fruits[0]
  act(() => {
    result.current.handleFruitInteraction(apple, 'click')
  })
}

function missOnApple(result: { current: ReturnType<typeof useGameLogic> }): void {
  const apple = result.current.fruits[0]
  act(() => {
    // りんごへの右クリックは不正操作（得点0）
    result.current.handleFruitInteraction(apple, 'rightClick')
  })
}

describe('useGameLogic - アーケードモード', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => { jest.runOnlyPendingTimers() })
    jest.useRealTimers()
  })

  it('A-1: 既定は練習モード', () => {
    const { result } = renderHook(() => useGameLogic())
    expect(result.current.mode).toBe('practice')
  })

  it('A-2: アーケード開始で60秒・固定フルーツ数になる', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => { result.current.startGame('arcade') })

    expect(result.current.mode).toBe('arcade')
    expect(result.current.gameState).toBe('playing')
    expect(result.current.timeLeft).toBe(ARCADE_CONFIG.duration)
    expect(result.current.fruits).toHaveLength(ARCADE_CONFIG.fruitCount)
  })

  it('A-2b: アーケードの持ち時間は難易度設定に左右されない', () => {
    const { result } = renderHook(() => useGameLogic())

    // かんたん（時間1.5倍）を選んでも、アーケードは常に60秒
    act(() => { result.current.difficulty.setDifficulty('easy') })
    act(() => { result.current.startGame('arcade') })

    expect(result.current.timeLeft).toBe(ARCADE_CONFIG.duration)
  })

  it('A-3: 連続収穫でコンボ倍率がスコアに乗る', () => {
    const { result } = renderHook(() => useGameLogic())
    act(() => { result.current.startGame('arcade') })

    harvestApple(result) // コンボ1 → 等倍: 10
    expect(result.current.score).toBe(10)

    harvestApple(result) // コンボ2 → 等倍: +10
    expect(result.current.score).toBe(20)

    harvestApple(result) // コンボ3 → 2倍: +20
    expect(result.current.score).toBe(40)
    expect(result.current.arcade.combo).toBe(3)
    expect(result.current.arcade.comboMultiplier).toBe(2)
  })

  it('A-4: 誤操作でコンボが切れる', () => {
    const { result } = renderHook(() => useGameLogic())
    act(() => { result.current.startGame('arcade') })

    harvestApple(result)
    harvestApple(result)
    expect(result.current.arcade.combo).toBe(2)

    missOnApple(result)
    expect(result.current.arcade.combo).toBe(0)
    expect(result.current.arcade.comboMultiplier).toBe(1)
  })

  it('A-4b: 誤操作ではスコアが減らない', () => {
    const { result } = renderHook(() => useGameLogic())
    act(() => { result.current.startGame('arcade') })

    harvestApple(result)
    const scoreBefore = result.current.score
    missOnApple(result)
    expect(result.current.score).toBe(scoreBefore)
  })

  it('A-5: アーケードではステージクリアで中断されない', () => {
    const { result } = renderHook(() => useGameLogic())
    act(() => { result.current.startGame('arcade') })

    for (let i = 0; i < 25; i++) {
      harvestApple(result)
    }

    expect(result.current.gameState).toBe('playing')
    expect(result.current.score).toBeGreaterThan(0)
  })

  it('A-6: 時間切れで結果（自己ベスト・段位）が確定する', () => {
    const { result } = renderHook(() => useGameLogic())
    act(() => { result.current.startGame('arcade') })

    harvestApple(result)
    harvestApple(result)

    act(() => { jest.advanceTimersByTime(ARCADE_CONFIG.duration * 1000) })

    expect(result.current.gameState).toBe('idle')
    expect(result.current.arcadeResult).not.toBeNull()
    expect(result.current.arcadeResult?.score).toBe(20)
    expect(result.current.arcadeResult?.isNewBest).toBe(true)
    expect(result.current.arcadeResult?.best).toBe(20)
    expect(result.current.arcadeResult?.rank).toBe('bronze')
    expect(result.current.arcadeResult?.maxCombo).toBe(2)
  })

  it('A-6b: アーケードのベストは練習モードのハイスコアと別枠', () => {
    const { result } = renderHook(() => useGameLogic())
    act(() => { result.current.startGame('arcade') })
    harvestApple(result)
    act(() => { jest.advanceTimersByTime(ARCADE_CONFIG.duration * 1000) })

    expect(result.current.arcade.best).toBe(10)
    expect(localStorage.getItem('fruitHarvestArcadeBest')).toBe('10')
  })

  it('A-6c: もう一度アーケードを始めると前回の結果が消える', () => {
    const { result } = renderHook(() => useGameLogic())
    act(() => { result.current.startGame('arcade') })
    harvestApple(result)
    act(() => { jest.advanceTimersByTime(ARCADE_CONFIG.duration * 1000) })
    expect(result.current.arcadeResult).not.toBeNull()

    act(() => { result.current.startGame('arcade') })
    expect(result.current.arcadeResult).toBeNull()
    expect(result.current.score).toBe(0)
    expect(result.current.arcade.combo).toBe(0)
  })

  it('A-6d: リセットで練習モードに戻り結果表示も消える', () => {
    const { result } = renderHook(() => useGameLogic())
    act(() => { result.current.startGame('arcade') })
    harvestApple(result)
    act(() => { jest.advanceTimersByTime(ARCADE_CONFIG.duration * 1000) })

    act(() => { result.current.resetGame() })

    expect(result.current.mode).toBe('practice')
    expect(result.current.arcadeResult).toBeNull()
  })

  it('A-7: 練習モードではコンボ倍率が乗らない（従来どおり）', () => {
    const { result } = renderHook(() => useGameLogic())
    act(() => { result.current.startGame('practice') })

    harvestApple(result)
    harvestApple(result)
    harvestApple(result)

    expect(result.current.score).toBe(30)
  })

  it('A-7b: 引数なしの startGame は従来どおり練習モード', () => {
    const { result } = renderHook(() => useGameLogic())
    act(() => { result.current.startGame() })
    expect(result.current.mode).toBe('practice')
  })

  it('A-8: フィーバー中は収穫でフルーツが増えるが上限を超えない', () => {
    const { result } = renderHook(() => useGameLogic())
    act(() => { result.current.startGame('arcade') })

    // ゲージが満タンになるまで収穫し続ける
    for (let i = 0; i < 40; i++) {
      harvestApple(result)
    }

    expect(result.current.arcade.isFever).toBe(true)
    expect(result.current.fruits.length).toBeLessThanOrEqual(ARCADE_CONFIG.maxFruits)
    expect(result.current.fruits.length).toBeGreaterThan(ARCADE_CONFIG.fruitCount)
  })

  it('A-9: アーケードのスコアは難易度設定に左右されない（記録の公平性）', () => {
    const { result } = renderHook(() => useGameLogic())
    act(() => { result.current.difficulty.setDifficulty('hard') })
    act(() => { result.current.startGame('arcade') })

    harvestApple(result)

    // hard は練習モードでは +20% だが、アーケードでは素点のまま
    expect(result.current.score).toBe(10)
  })
})
