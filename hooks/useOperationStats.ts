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
  recordSuccess: (action: InteractionType) => void
  recordFailure: (action: InteractionType) => void
  resetSession: () => void
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

  const clearBonusTimer = useCallback(() => {
    if (bonusTimerRef.current !== null) {
      clearTimeout(bonusTimerRef.current)
      bonusTimerRef.current = null
    }
  }, [])

  const recordSuccess = useCallback((action: InteractionType) => {
    setSessionStats(prev => ({
      ...prev,
      [action]: { ...prev[action], success: prev[action].success + 1 },
    }))
    setStreak(prev => {
      const next = prev + 1
      clearBonusTimer()
      bonusTimerRef.current = setTimeout(() => setLastStreakBonus(highestTriggeredBonus(next)), 0)
      return next
    })
  }, [clearBonusTimer])

  const recordFailure = useCallback((action: InteractionType) => {
    setSessionStats(prev => ({
      ...prev,
      [action]: { ...prev[action], fail: prev[action].fail + 1 },
    }))
    clearBonusTimer()
    setStreak(0)
    setLastStreakBonus(null)
  }, [clearBonusTimer])

  const resetSession = useCallback(() => {
    setSessionStats(createEmptySessionStats())
    clearBonusTimer()
    setStreak(0)
    setLastStreakBonus(null)
  }, [clearBonusTimer])

  return { sessionStats, streak, lastStreakBonus, recordSuccess, recordFailure, resetSession }
}
