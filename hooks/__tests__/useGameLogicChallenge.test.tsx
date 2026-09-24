import { renderHook, act } from '@testing-library/react'
import { useGameLogic } from '../useGameLogic'
import { ARCADE_CONFIG } from '../../types/arcade'
import type { Fruit } from '../../types/game'

/**
 * チャレンジ（arcade）の「時間をかせぐ型」と段差・にがてな操作（v1.2 D1・D2・D4、docs/game-spec.md §4.2・§5）。
 */
describe('useGameLogic: チャレンジ', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    act(() => { jest.runOnlyPendingTimers() })
    jest.useRealTimers()
  })

  type Hook = { current: ReturnType<typeof useGameLogic> }
  const start = (result: Hook) => act(() => { result.current.startGame('arcade') })
  const fruitOf = (result: Hook, type: Fruit['type']): Fruit => ({ ...result.current.fruits[0], type })
  const harvestApple = (result: Hook) => act(() => {
    // 畑の中身はランダムなので、取り除かれる対象として実在する id を使う
    result.current.handleFruitInteraction(fruitOf(result, 'apple'), 'click')
  })
  const tick = (seconds: number) => {
    for (let i = 0; i < seconds; i++) act(() => { jest.advanceTimersByTime(1000) })
  }

  it('開始時の残り時間は ARCADE_CONFIG.startTimeSec', () => {
    const { result } = renderHook(() => useGameLogic())
    start(result)
    expect(result.current.timeLeft).toBe(ARCADE_CONFIG.startTimeSec)
  })

  it('正しく取ると残り時間が増え、ミスで減る', () => {
    const { result } = renderHook(() => useGameLogic())
    start(result)
    tick(ARCADE_CONFIG.startTimeSec - 20) // 残り 20 秒
    expect(result.current.timeLeft).toBe(20)

    harvestApple(result) // +1.8 秒 → 21.8 → 表示は切り上げて 22
    expect(result.current.timeLeft).toBe(22)

    act(() => { result.current.handleFruitInteraction(fruitOf(result, 'lemon'), 'click') }) // ミス −2 秒 → 19.8
    expect(result.current.timeLeft).toBe(20)
  })

  it('何もしなければ開始時間ちょうどで終わる（それより前には終わらない）', () => {
    const { result } = renderHook(() => useGameLogic())
    start(result)
    tick(ARCADE_CONFIG.startTimeSec - 1)
    expect(result.current.gameState).toBe('playing')
    tick(1)
    expect(result.current.gameState).toBe('idle')
    expect(result.current.arcadeResult).not.toBeNull()
  })

  it('取り続けると開始時間を過ぎても続く', () => {
    const { result } = renderHook(() => useGameLogic())
    start(result)
    for (let s = 0; s < ARCADE_CONFIG.startTimeSec + 15; s++) {
      harvestApple(result)
      tick(1)
    }
    expect(result.current.gameState).toBe('playing')
  })

  it('25 個取ると果物が動き出す（難しくなる段差は1か所）', () => {
    const { result } = renderHook(() => useGameLogic())
    start(result)
    for (let i = 0; i < ARCADE_CONFIG.moveAfterHarvests - 1; i++) harvestApple(result)
    expect(result.current.arcadeFruitsMoving).toBe(false)
    harvestApple(result)
    expect(result.current.arcadeFruitsMoving).toBe(true)
  })

  it('結果に、ミスがいちばん多かった果物の操作が「にがてな そうさ」として入る', () => {
    const { result } = renderHook(() => useGameLogic())
    start(result)
    act(() => { result.current.handleFruitInteraction(fruitOf(result, 'blueberry'), 'click') })
    act(() => { result.current.handleFruitInteraction(fruitOf(result, 'blueberry'), 'rightClick') })
    act(() => { result.current.handleFruitInteraction(fruitOf(result, 'lemon'), 'click') })
    tick(ARCADE_CONFIG.startTimeSec + 10)
    expect(result.current.arcadeResult?.weakOperation).toBe('doubleClick')
    expect(result.current.arcadeResult?.endReason).toBe('timeUp')
  })

  it('ミスが無ければ「にがてな そうさ」は無い', () => {
    const { result } = renderHook(() => useGameLogic())
    start(result)
    tick(ARCADE_CONFIG.startTimeSec + 1)
    expect(result.current.arcadeResult?.weakOperation).toBeNull()
  })

  it('小数の秒は切り上げずに積み上がる（表示の整数で内部の時間を上書きしない）', () => {
    // 150 個以上取ると、1個で増えるのは 0.3 秒。0.8 秒ごとに取っても 1 秒に 0.375 秒しか増えないので、
    // 残り時間は減っていく。表示用の切り上げた整数で内部の時間を上書きしていたころは、
    // 0.3 秒が毎回 1 秒に化けて、いつまでも 60 秒に張り付いていた（2026-09-24 の計測で発見）
    const { result } = renderHook(() => useGameLogic())
    start(result)
    for (let i = 0; i < 160; i++) harvestApple(result) // 取った数を 160 にする（残り時間は上限 60 秒）
    expect(result.current.timeLeft).toBe(60)
    for (let ms = 0; ms < 40_000; ms += 800) {
      act(() => { jest.advanceTimersByTime(800) })
      harvestApple(result)
    }
    // 40 秒で 50 個 × 0.3 秒 = 15 秒増え、40 秒減る → 残り 35 秒前後
    expect(result.current.timeLeft).toBeLessThanOrEqual(40)
    expect(result.current.timeLeft).toBeGreaterThanOrEqual(30)
  })
})

