'use client'

import { useCallback, useEffect, useState } from 'react'
import type { DailyGoal, DateString, SessionOperationStats } from '@/types/gamification'
import {
  addStamp,
  calculateStreak,
  evaluateDailyGoals,
  getTodayString,
  isDailyGoalComplete,
  loadDailyPracticeData,
  saveDailyPracticeData,
  createDefaultDailyPracticeData,
} from '@/lib/dailyPracticeManager'

export interface UseDailyPracticeReturn {
  todayGoals: DailyGoal
  isGoalComplete: boolean
  practiceStreak: number
  stamps: DateString[]
  updateGoals: (sessionStats: SessionOperationStats) => void
  stampToday: () => void
  isHydrated: boolean
}

export function useDailyPractice(): UseDailyPracticeReturn {
  const [data, setData] = useState(() => createDefaultDailyPracticeData())
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    try {
      const loaded = loadDailyPracticeData()
      const today = getTodayString()
      // AC-8.7: 日付が変わっていれば目標をリセット
      if (loaded.todayDate !== today) {
        const reset = { ...loaded, todayDate: today, todayGoals: createDefaultDailyPracticeData(today).todayGoals }
        saveDailyPracticeData(reset)
        setData(reset)
      } else {
        setData(loaded)
      }
    } catch {
      setData(createDefaultDailyPracticeData())
    } finally {
      setIsHydrated(true)
    }
  }, [])

  const today = getTodayString()
  const practiceStreak = calculateStreak(data.stamps, today)
  const isGoalComplete = isDailyGoalComplete(data.todayGoals)

  const updateGoals = useCallback((sessionStats: SessionOperationStats) => {
    const currentToday = getTodayString()
    setData(prev => {
      // AC-8.7: midnight跨ぎ検出 — 日付が変わっていれば目標リセット
      const base = prev.todayDate !== currentToday
        ? createDefaultDailyPracticeData(currentToday)
        : prev
      const g = evaluateDailyGoals(sessionStats)
      const todayGoals: DailyGoal = {
        click: base.todayGoals.click || g.click,
        doubleClick: base.todayGoals.doubleClick || g.doubleClick,
        rightClick: base.todayGoals.rightClick || g.rightClick,
        drop: base.todayGoals.drop || g.drop,
      }
      // stamps は日付リセット時も保持（createDefaultDailyPracticeData が stamps を空にするため明示的に上書き）
      const merged = { ...base, todayGoals, todayDate: currentToday, stamps: prev.stamps }
      saveDailyPracticeData(merged)
      return merged
    })
  }, [])

  const stampToday = useCallback(() => {
    setData(prev => {
      const nextStamps = addStamp(prev.stamps, today)
      const merged = { ...prev, stamps: nextStamps }
      saveDailyPracticeData(merged)
      return merged
    })
  }, [today])

  return {
    todayGoals: data.todayGoals,
    isGoalComplete,
    practiceStreak,
    stamps: data.stamps.stamps,
    updateGoals,
    stampToday,
    isHydrated,
  }
}
