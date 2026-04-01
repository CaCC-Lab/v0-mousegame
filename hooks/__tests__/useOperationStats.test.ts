/**
 * テスト観点表（useOperationStats）
 *
 * | Case ID | Input | Perspective | Expected | Notes |
 * |---------|-------|-------------|----------|-------|
 * | TC-N-01 | recordSuccess x3 | AC-4.1 | にこにこ | - |
 * | TC-N-02 | recordSuccess x5 | AC-4.2 | ボーナス | - |
 * | TC-N-03 | recordSuccess x10 | AC-4.3 | すごい | - |
 * | TC-A-01 | recordFailure | AC-4.4 | streak=0 | - |
 * | TC-CP-4 | success連続 | CP-4 | streak+1 | - |
 */

import { renderHook, act } from '@testing-library/react'
import { useOperationStats } from '../useOperationStats'

describe('useOperationStats', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('AC-5.1 / AC-5.2: 成功・失敗が操作別にカウントされる', () => {
    const { result } = renderHook(() => useOperationStats())
    act(() => {
      result.current.recordSuccess('click')
      result.current.recordFailure('doubleClick')
    })
    act(() => {
      jest.runAllTimers()
    })
    expect(result.current.sessionStats.click.success).toBe(1)
    expect(result.current.sessionStats.doubleClick.fail).toBe(1)
  })

  it('AC-5.4: resetSession でセッション統計が初期化される', () => {
    const { result } = renderHook(() => useOperationStats())
    act(() => {
      result.current.recordSuccess('drop')
      result.current.resetSession()
    })
    act(() => {
      jest.runAllTimers()
    })
    expect(result.current.sessionStats.drop.success).toBe(0)
    expect(result.current.streak).toBe(0)
  })

  it('AC-4.4 / CP-4: ミスで連続が0にリセット', () => {
    const { result } = renderHook(() => useOperationStats())
    act(() => {
      result.current.recordSuccess('click')
      result.current.recordSuccess('click')
    })
    act(() => {
      jest.runAllTimers()
    })
    expect(result.current.streak).toBe(2)
    act(() => {
      result.current.recordFailure('click')
    })
    act(() => {
      jest.runAllTimers()
    })
    expect(result.current.streak).toBe(0)
    expect(result.current.lastStreakBonus).toBeNull()
  })

  it('AC-4.1: 3連続でスマイル系ボーナスが付く', () => {
    const { result } = renderHook(() => useOperationStats())
    act(() => {
      result.current.recordSuccess('click')
      result.current.recordSuccess('click')
      result.current.recordSuccess('click')
    })
    act(() => {
      jest.runAllTimers()
    })
    expect(result.current.lastStreakBonus?.type).toBe('smile')
  })

  it('AC-4.2: 5連続で bonusFruit', () => {
    const { result } = renderHook(() => useOperationStats())
    act(() => {
      for (let i = 0; i < 5; i++) result.current.recordSuccess('click')
    })
    act(() => {
      jest.runAllTimers()
    })
    expect(result.current.lastStreakBonus?.type).toBe('bonusFruit')
  })

  it('AC-4.3: 10連続で amazing', () => {
    const { result } = renderHook(() => useOperationStats())
    act(() => {
      for (let i = 0; i < 10; i++) result.current.recordSuccess('click')
    })
    act(() => {
      jest.runAllTimers()
    })
    expect(result.current.lastStreakBonus?.type).toBe('amazing')
  })

  it('CP-3: カウンタは常に非負整数', () => {
    const { result } = renderHook(() => useOperationStats())
    act(() => {
      for (let i = 0; i < 20; i++) {
        result.current.recordSuccess('rightClick')
        if (i % 7 === 0) result.current.recordFailure('rightClick')
      }
    })
    act(() => {
      jest.runAllTimers()
    })
    const s = result.current.sessionStats
    expect(s.rightClick.success).toBeGreaterThanOrEqual(0)
    expect(s.rightClick.fail).toBeGreaterThanOrEqual(0)
  })

  it('空配列のセッション初期状態: すべて0', () => {
    const { result } = renderHook(() => useOperationStats())
    expect(result.current.sessionStats.click.success).toBe(0)
    expect(result.current.sessionStats.drop.fail).toBe(0)
  })
})
