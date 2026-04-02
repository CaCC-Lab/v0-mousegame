'use client'

import { useCallback, useRef, useState } from 'react'
import type { InteractionType } from '@/types/game'
import type { SessionOperationStats, StreakBonus } from '@/types/gamification'
import { STREAK_BONUSES } from '@/types/gamification'
import { createEmptySessionStats } from '@/lib/gamificationManager'

export interface UseOperationStatsReturn {
  sessionStats: SessionOperationStats
  streak: number
  lastStreakBonus: StreakBonus | null
  /** 成功を記録し、更新後のstreak値を返す */
  recordSuccess: (action: InteractionType) => number
  recordFailure: (action: InteractionType) => void
  resetSession: () => void
  /** React state更新前の最新sessionStatsを同期的に取得 */
  getLatestSessionStats: () => SessionOperationStats
}

function highestTriggeredBonus(streak: number): StreakBonus | null {
  let best: StreakBonus | null = null
  for (const b of STREAK_BONUSES) {
    if (streak >= b.threshold) best = b
  }
  return best
}

export function useOperationStats(): UseOperationStatsReturn {
  const [sessionStats, setSessionStats] = useState<SessionOperationStats>(createEmptySessionStats)
  const [streak, setStreak] = useState(0)
  const [lastStreakBonus, setLastStreakBonus] = useState<StreakBonus | null>(null)
  const bonusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const streakRef = useRef(0)
  const sessionStatsRef = useRef<SessionOperationStats>(createEmptySessionStats())

  const clearBonusTimer = useCallback(() => {
    if (bonusTimerRef.current !== null) {
      clearTimeout(bonusTimerRef.current)
      bonusTimerRef.current = null
    }
  }, [])

  const recordSuccess = useCallback((action: InteractionType): number => {
    setSessionStats(prev => {
      const next = { ...prev, [action]: { ...prev[action], success: prev[action].success + 1 } }
      sessionStatsRef.current = next
      return next
    })
    const nextStreak = streakRef.current + 1
    streakRef.current = nextStreak
    setStreak(nextStreak)
    clearBonusTimer()
    bonusTimerRef.current = setTimeout(() => setLastStreakBonus(highestTriggeredBonus(nextStreak)), 0)
    return nextStreak
  }, [clearBonusTimer])

  const recordFailure = useCallback((action: InteractionType) => {
    setSessionStats(prev => {
      const next = { ...prev, [action]: { ...prev[action], fail: prev[action].fail + 1 } }
      sessionStatsRef.current = next
      return next
    })
    clearBonusTimer()
    streakRef.current = 0
    setStreak(0)
    setLastStreakBonus(null)
  }, [clearBonusTimer])

  const getLatestSessionStats = useCallback(() => sessionStatsRef.current, [])

  const resetSession = useCallback(() => {
    sessionStatsRef.current = createEmptySessionStats()
    setSessionStats(createEmptySessionStats())
    clearBonusTimer()
    streakRef.current = 0
    setStreak(0)
    setLastStreakBonus(null)
  }, [clearBonusTimer])

  return { sessionStats, streak, lastStreakBonus, recordSuccess, recordFailure, resetSession, getLatestSessionStats }
}
