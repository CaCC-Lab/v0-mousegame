/**
 * Task 11.3 / design.md §12.3 — useDailyPractice
 *
 * テスト観点表（抜粋）
 * | Case ID | Expected |
 * |---------|----------|
 * | TC-10.3 | cumulativeStats 由来で todayGoals / streak が導出 |
 * | TC-10.3b | isHydrated が true になる |
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { createEmptySessionStats } from '@/lib/gamificationManager'
import { useDailyPractice } from '../useDailyPractice'

describe('useDailyPractice (Task 11 / design §12.3)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('isHydrated が true になる', async () => {
    const { result } = renderHook(() => useDailyPractice())
    await waitFor(() => expect(result.current.isHydrated).toBe(true))
  })

  it('updateGoals でセッション統計から目標が更新され、全達成で isGoalComplete が true', async () => {
    const { result } = renderHook(() => useDailyPractice())
    await waitFor(() => expect(result.current.isHydrated).toBe(true))

    const session = createEmptySessionStats()
    session.click.success = 1
    session.doubleClick.success = 1
    session.rightClick.success = 1
    session.drop.success = 1

    act(() => {
      result.current.updateGoals(session)
    })

    expect(result.current.todayGoals.click).toBe(true)
    expect(result.current.todayGoals.doubleClick).toBe(true)
    expect(result.current.todayGoals.rightClick).toBe(true)
    expect(result.current.todayGoals.drop).toBe(true)
    expect(result.current.isGoalComplete).toBe(true)
  })

  it('stampToday で今日の日付がスタンプに含まれ practiceStreak が 1 以上', async () => {
    const { result } = renderHook(() => useDailyPractice())
    await waitFor(() => expect(result.current.isHydrated).toBe(true))

    act(() => {
      result.current.stampToday()
    })

    const today = new Date()
    const y = today.getFullYear()
    const mo = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const todayStr = `${y}-${mo}-${d}`
    expect(result.current.stamps).toContain(todayStr)
    expect(result.current.practiceStreak).toBeGreaterThanOrEqual(1)
  })
})
