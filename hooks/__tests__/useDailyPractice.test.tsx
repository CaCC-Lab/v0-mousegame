/**
 * Task 11.3 / design.md §12.3 — useDailyPractice
 *
 * hooks/useDailyPractice.ts 未追加のため、../../lib/dailyPracticeManager と ../useDailyPractice を virtual mock。
 * Task 11.3 マージ後はモックを外して実フックを import すること。
 *
 * テスト観点表（抜粋）
 * | Case ID | Expected |
 * |---------|----------|
 * | TC-10.3 | cumulativeStats 由来で todayGoals / streak が導出 |
 * | TC-10.3b | isHydrated が true になる |
 */

import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { SessionOperationStats } from '@/types/gamification'
import { createEmptySessionStats } from '@/lib/gamificationManager'

jest.mock('../../lib/dailyPracticeManager', () => {
  const DAILY_PRACTICE_STORAGE_KEY = 'dailyPracticeData'
  const DAILY_PRACTICE_VERSION = 1
  type DateString = string
  type DailyGoal = {
    click: boolean
    doubleClick: boolean
    rightClick: boolean
    drop: boolean
  }
  type PracticeStampData = { stamps: DateString[] }
  type DailyPracticeData = {
    todayGoals: DailyGoal
    todayDate: DateString
    stamps: PracticeStampData
    version: number
  }
  function getTodayString(now?: Date): DateString {
    const d = now ?? new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  function createDefaultDailyPracticeData(today?: DateString): DailyPracticeData {
    const t = today ?? getTodayString()
    return {
      version: DAILY_PRACTICE_VERSION,
      todayDate: t,
      todayGoals: { click: false, doubleClick: false, rightClick: false, drop: false },
      stamps: { stamps: [] },
    }
  }
  function evaluateDailyGoals(sessionStats: SessionOperationStats): DailyGoal {
    return {
      click: sessionStats.click.success > 0,
      doubleClick: sessionStats.doubleClick.success > 0,
      rightClick: sessionStats.rightClick.success > 0,
      drop: sessionStats.drop.success > 0,
    }
  }
  function isDailyGoalComplete(goals: DailyGoal): boolean {
    return goals.click && goals.doubleClick && goals.rightClick && goals.drop
  }
  function addStamp(stamps: PracticeStampData, date: DateString): PracticeStampData {
    if (stamps.stamps.includes(date)) return stamps
    return { stamps: [...stamps.stamps, date].sort() }
  }
  function prevDayString(dateStr: DateString): DateString {
    const d = new Date(`${dateStr}T12:00:00`)
    d.setDate(d.getDate() - 1)
    return getTodayString(d)
  }
  function calculateStreak(stamps: PracticeStampData, today: DateString): number {
    if (!stamps.stamps.includes(today)) return 0
    let count = 0
    let day: DateString = today
    const set = new Set(stamps.stamps)
    while (set.has(day)) {
      count++
      day = prevDayString(day)
    }
    return count
  }
  function parseDailyPracticeData(raw: string | null | undefined): DailyPracticeData {
    if (raw == null || raw === '') return createDefaultDailyPracticeData()
    try {
      const parsed = JSON.parse(raw) as Partial<DailyPracticeData>
      if (typeof parsed !== 'object' || parsed == null) return createDefaultDailyPracticeData()
      if (typeof parsed.version !== 'number') return createDefaultDailyPracticeData()
      const base = createDefaultDailyPracticeData(
        typeof parsed.todayDate === 'string' ? parsed.todayDate : undefined
      )
      if (parsed.stamps && Array.isArray(parsed.stamps.stamps)) {
        base.stamps = { stamps: [...parsed.stamps.stamps] }
      }
      if (parsed.todayGoals) {
        base.todayGoals = {
          click: !!parsed.todayGoals.click,
          doubleClick: !!parsed.todayGoals.doubleClick,
          rightClick: !!parsed.todayGoals.rightClick,
          drop: !!parsed.todayGoals.drop,
        }
      }
      return base
    } catch {
      return createDefaultDailyPracticeData()
    }
  }
  function loadDailyPracticeData(storage?: Pick<Storage, 'getItem'>): DailyPracticeData {
    const s = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null)
    if (!s) return createDefaultDailyPracticeData()
    try {
      const raw = s.getItem(DAILY_PRACTICE_STORAGE_KEY)
      return parseDailyPracticeData(raw)
    } catch {
      return createDefaultDailyPracticeData()
    }
  }
  function saveDailyPracticeData(data: DailyPracticeData, storage?: Pick<Storage, 'setItem'>): void {
    const s = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null)
    if (!s) return
    try {
      s.setItem(DAILY_PRACTICE_STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* noop */
    }
  }
  return {
    DAILY_PRACTICE_STORAGE_KEY,
    DAILY_PRACTICE_VERSION,
    getTodayString,
    createDefaultDailyPracticeData,
    evaluateDailyGoals,
    isDailyGoalComplete,
    addStamp,
    calculateStreak,
    loadDailyPracticeData,
    saveDailyPracticeData,
    parseDailyPracticeData,
  }
}, { virtual: true })

jest.mock('../useDailyPractice', () => {
  const React = require('react') as typeof import('react')
  const m = require('../../lib/dailyPracticeManager') as typeof import('../../lib/dailyPracticeManager')
  function useDailyPractice() {
    const [data, setData] = React.useState(() => m.loadDailyPracticeData())
    const [hydrated, setHydrated] = React.useState(false)
    React.useEffect(() => {
      setHydrated(true)
    }, [])
    const today = m.getTodayString()
    const practiceStreak = m.calculateStreak(data.stamps, today)
    const isGoalComplete = m.isDailyGoalComplete(data.todayGoals)
    const updateGoals = (sessionStats: SessionOperationStats) => {
      setData(prev => {
        const g = m.evaluateDailyGoals(sessionStats)
        const todayGoals = {
          click: prev.todayGoals.click || g.click,
          doubleClick: prev.todayGoals.doubleClick || g.doubleClick,
          rightClick: prev.todayGoals.rightClick || g.rightClick,
          drop: prev.todayGoals.drop || g.drop,
        }
        const merged = { ...prev, todayGoals, todayDate: today }
        m.saveDailyPracticeData(merged)
        return merged
      })
    }
    const stampToday = () => {
      setData(prev => {
        const nextStamps = m.addStamp(prev.stamps, today)
        const merged = { ...prev, stamps: nextStamps }
        m.saveDailyPracticeData(merged)
        return merged
      })
    }
    return {
      todayGoals: data.todayGoals,
      isGoalComplete,
      practiceStreak,
      stamps: data.stamps.stamps,
      updateGoals,
      stampToday,
      isHydrated: hydrated,
    }
  }
  return { useDailyPractice }
}, { virtual: true })

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
