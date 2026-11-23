import { renderHook, act } from '@testing-library/react'
import { useGameLogic } from '../useGameLogic'
import type { Fruit } from '../../types/game'

/**
 * スイカをかご（ドロップ領域）の外で離したらミス（docs/game-spec.md §2）。
 *
 * | Case ID | Input / Precondition | Perspective | Expected Result | Notes |
 * |---|---|---|---|---|
 * | DM-N-01 | スイカを領域内で drop | Equivalence – normal | 点が入り、drop 成功 1 | 従来どおり |
 * | DM-A-01 | スイカを領域外で drop（missedTarget） | Equivalence – 失敗 | 0点、drop ミス 1、スイカは残る | - |
 * | DM-A-02 | 領域外 drop | 失敗のヒント | 「ドラッグ」のヒント | - |
 * | DM-A-03 | missedTarget=false | Boundary | 成功（領域内と同じ） | - |
 * | DM-A-04 | options 省略 | Boundary – undefined | 成功（従来どおり） | - |
 */
describe('useGameLogic: スイカを場所の外で離したらミス', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    localStorage.clear()
  })
  afterEach(() => {
    act(() => { jest.runOnlyPendingTimers() })
    jest.useRealTimers()
  })

  const start = () => {
    const hook = renderHook(() => useGameLogic())
    act(() => { hook.result.current.startGame() })
    const watermelon: Fruit = { ...hook.result.current.fruits[0], type: 'watermelon' }
    return { ...hook, watermelon }
  }

  it('DM-N-01: 領域内の drop は点が入り、成功として数える', () => {
    // Given: れんしゅう中 When: 領域内で drop Then: 点が入る・成功 1
    const { result, watermelon } = start()
    act(() => { result.current.handleFruitInteraction(watermelon, 'drop') })
    expect(result.current.score).toBeGreaterThan(0)
    expect(result.current.operationStats.getLatestSessionStats().drop).toEqual({ success: 1, fail: 0 })
  })

  it('DM-A-01: 領域外の drop は0点・ミスで、スイカは畑に残る', () => {
    // Given: れんしゅう中 When: 領域外で drop Then: 0点・ミス 1・スイカは消えない
    const { result, watermelon } = start()
    act(() => { result.current.handleFruitInteraction(watermelon, 'drop', { missedTarget: true }) })
    expect(result.current.score).toBe(0)
    expect(result.current.operationStats.getLatestSessionStats().drop).toEqual({ success: 0, fail: 1 })
    expect(result.current.fruits.some(f => f.id === watermelon.id)).toBe(true)
  })

  it('DM-A-02: 領域外の drop では「ドラッグ」のヒントを出す', () => {
    // Given: れんしゅう中 When: 領域外で drop Then: スイカ・drop のヒント
    const { result, watermelon } = start()
    act(() => { result.current.handleFruitInteraction(watermelon, 'drop', { missedTarget: true }) })
    expect(result.current.missHint).toMatchObject({ fruitType: 'watermelon', requiredAction: 'drop' })
  })

  it('DM-A-03: missedTarget=false は成功', () => {
    // Given: れんしゅう中 When: missedTarget=false Then: 成功 1
    const { result, watermelon } = start()
    act(() => { result.current.handleFruitInteraction(watermelon, 'drop', { missedTarget: false }) })
    expect(result.current.operationStats.getLatestSessionStats().drop).toEqual({ success: 1, fail: 0 })
  })

  it('DM-A-04: options 省略は成功（従来の呼び方）', () => {
    // Given: れんしゅう中 When: options なし Then: ミスは 0
    const { result, watermelon } = start()
    act(() => { result.current.handleFruitInteraction(watermelon, 'drop', undefined) })
    expect(result.current.operationStats.getLatestSessionStats().drop.fail).toBe(0)
  })
})
