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
    setData(prev => {
      const g = evaluateDailyGoals(sessionStats)
      const todayGoals: DailyGoal = {
        click: prev.todayGoals.click || g.click,
        doubleClick: prev.todayGoals.doubleClick || g.doubleClick,
        rightClick: prev.todayGoals.rightClick || g.rightClick,
        drop: prev.todayGoals.drop || g.drop,
      }
      const merged = { ...prev, todayGoals, todayDate: today }
      saveDailyPracticeData(merged)
      return merged
    })
  }, [today])

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
