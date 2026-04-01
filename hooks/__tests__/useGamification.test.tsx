/**
 * テスト観点表（useGamification）
 *
 * | Case ID | Input | Perspective | Expected | Notes |
 * |---------|-------|-------------|----------|-------|
 * | TC-N-01 | commitSession | AC-6.1 | localStorage保存 | - |
 * | TC-N-02 | 低→高の星 | AC-1.4 | 上書き | - |
 * | TC-CP-1 | 複数commit | CP-1 | 星単調 | - |
 * | TC-CP-2 | バッジ獲得後 | CP-2 | 消えない | - |
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useGamification } from '../useGamification'
import { GAMIFICATION_STORAGE_KEY } from '@/types/gamification'
import { createEmptySessionStats } from '@/lib/gamificationManager'

describe('useGamification', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('isHydrated が true になる', async () => {
    const { result } = renderHook(() => useGamification())
    await waitFor(() => expect(result.current.isHydrated).toBe(true))
  })

  it('AC-6.1: commitSession で localStorage に保存される', async () => {
    const { result } = renderHook(() => useGamification())
    await waitFor(() => expect(result.current.isHydrated).toBe(true))

    const session = createEmptySessionStats()
    session.click.success = 5

    act(() => {
      result.current.commitSession(1, 2, session)
      jest.runAllTimers()
    })

    const raw = localStorage.getItem(GAMIFICATION_STORAGE_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.cumulativeStats.click.totalSuccess).toBe(5)
    expect(parsed.stageStars['1'] ?? parsed.stageStars[1]).toBe(2)
  })

  it('AC-1.4 / CP-1: 星は低下しない', async () => {
    const { result } = renderHook(() => useGamification())
    await waitFor(() => expect(result.current.isHydrated).toBe(true))

    const s = createEmptySessionStats()
    act(() => {
      result.current.commitSession(1, 3, s)
      jest.runAllTimers()
    })
    act(() => {
      result.current.commitSession(1, 1, s)
      jest.runAllTimers()
    })
    expect(result.current.stageStars[1]).toBe(3)
  })

  it('CP-2: 獲得バッジが消えない', async () => {
    const { result } = renderHook(() => useGamification())
    await waitFor(() => expect(result.current.isHydrated).toBe(true))

    const s = createEmptySessionStats()
    s.click.success = 100
    act(() => {
      result.current.commitSession(1, 1, s)
      jest.runAllTimers()
    })
    const after = [...result.current.earnedBadges]
    expect(after.length).toBeGreaterThan(0)

    act(() => {
      result.current.commitSession(2, 1, createEmptySessionStats())
      jest.runAllTimers()
    })
    for (const b of after) {
      expect(result.current.earnedBadges).toContain(b)
    }
  })

  it('badgeProgress が current/target を返す (AC-2.4)', async () => {
    const { result } = renderHook(() => useGamification())
    await waitFor(() => expect(result.current.isHydrated).toBe(true))
    expect(result.current.badgeProgress.clickMaster.target).toBe(30)
    expect(result.current.badgeProgress.clickMaster.current).toBeGreaterThanOrEqual(0)
  })

  it('calculateStarRating は lib と整合', async () => {
    const { result } = renderHook(() => useGamification())
    await waitFor(() => expect(result.current.isHydrated).toBe(true))
    const stats = createEmptySessionStats()
    stats.click.success = 10
    const stars = result.current.calculateStarRating(1, true, 20, 100, stats)
    expect(stars).toBe(3)
  })

  it('clearNewBadge が通知を消す', async () => {
    const { result } = renderHook(() => useGamification())
    await waitFor(() => expect(result.current.isHydrated).toBe(true))

    const s = createEmptySessionStats()
    s.click.success = 50
    act(() => {
      result.current.commitSession(1, 1, s)
      jest.runAllTimers()
    })
    await waitFor(() => {
      if (result.current.newlyEarnedBadge) {
        act(() => {
          result.current.clearNewBadge()
        })
      }
    })
    expect(result.current.newlyEarnedBadge).toBeNull()
  })

  it('lastSessionStats が保存される (AC-5.4)', async () => {
    const { result } = renderHook(() => useGamification())
    await waitFor(() => expect(result.current.isHydrated).toBe(true))
    const s = createEmptySessionStats()
    s.drop.success = 2
    act(() => {
      result.current.commitSession(3, 1, s)
      jest.runAllTimers()
    })
    expect(result.current.lastSessionStats?.drop.success).toBe(2)
  })
})
