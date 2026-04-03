'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  BadgeDefinition,
  BadgeType,
  CumulativeOperationStats,
  GamificationSaveData,
  OperationMasteryData,
  SessionOperationStats,
  StarRating,
  StageStarData,
} from '@/types/gamification'
import { BADGE_DEFINITIONS } from '@/types/gamification'
import type { InteractionType } from '@/types/game'
import {
  addSessionToCumulative,
  calculateAllMasteryLevels,
  calculateStarRating,
  checkBadgeEarned,
  createDefaultGamificationData,
  getProgressToNextLevel,
  loadGamificationData,
  mergeStageStarsMonotonic,
  saveGamificationData,
} from '@/lib/gamificationManager'

export interface UseGamificationReturn {
  stageStars: StageStarData
  earnedBadges: BadgeType[]
  badgeProgress: { [key in BadgeType]: { current: number; target: number } }
  cumulativeStats: CumulativeOperationStats
  lastSessionStats: SessionOperationStats | null
  /** commitSession前のセッション統計（ResultModalの前回比較用, AC-3.2） */
  previousSessionStats: SessionOperationStats | null
  newlyEarnedBadge: BadgeDefinition | null
  calculateStarRating: (
    stageNumber: number,
    cleared: boolean,
    timeLeft: number,
    timeLimit: number,
    sessionStats: SessionOperationStats
  ) => StarRating
  commitSession: (stageNumber: number, starRating: StarRating, sessionStats: SessionOperationStats) => void
  clearNewBadge: () => void
  masteryLevels: OperationMasteryData
  masteryProgress: { [K in InteractionType]: { current: number; nextThreshold: number; remaining: number } | null }
  isHydrated: boolean
}

function buildBadgeProgress(cumulative: CumulativeOperationStats): UseGamificationReturn['badgeProgress'] {
  const progress = {} as UseGamificationReturn['badgeProgress']
  for (const def of BADGE_DEFINITIONS) {
    progress[def.type] = {
      current: cumulative[def.requiredAction].totalSuccess,
      target: def.threshold,
    }
  }
  return progress
}

function applyCommitSession(
  prev: GamificationSaveData,
  stageNumber: number,
  starRating: StarRating,
  sessionStats: SessionOperationStats
): { next: GamificationSaveData; firstNewBadge: BadgeDefinition | null } {
  const beforeBadges = new Set(prev.badges.earnedBadges)

  let next: GamificationSaveData = {
    ...prev,
    cumulativeStats: addSessionToCumulative(prev.cumulativeStats, sessionStats),
    lastSessionStats: sessionStats,
    stageStars: mergeStageStarsMonotonic(prev.stageStars, stageNumber, starRating),
  }

  let firstNewBadge: BadgeDefinition | null = null

  // バッジを連鎖的にチェック（1セッションで複数獲得の可能性）
  let candidate = checkBadgeEarned(next.cumulativeStats, next.badges.earnedBadges)
  while (candidate) {
    next = {
      ...next,
      badges: {
        earnedBadges: [...next.badges.earnedBadges, candidate],
        earnedAt: { ...next.badges.earnedAt, [candidate]: Date.now() },
      },
    }
    if (!beforeBadges.has(candidate) && !firstNewBadge) {
      firstNewBadge = BADGE_DEFINITIONS.find(d => d.type === candidate) ?? null
    }
    candidate = checkBadgeEarned(next.cumulativeStats, next.badges.earnedBadges)
  }

  return { next, firstNewBadge }
}

export function useGamification(): UseGamificationReturn {
  const [data, setData] = useState<GamificationSaveData>(createDefaultGamificationData)
  const dataRef = useRef(data)
  dataRef.current = data
  const [previousSessionStats, setPreviousSessionStats] = useState<SessionOperationStats | null>(null)
  const [newlyEarnedBadge, setNewlyEarnedBadge] = useState<BadgeDefinition | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    try {
      setData(loadGamificationData())
    } catch {
      setData(createDefaultGamificationData())
    } finally {
      setIsHydrated(true)
    }
  }, [])

  const calculateStarRatingCb = useCallback(
    (_stageNumber: number, cleared: boolean, timeLeft: number, timeLimit: number, sessionStats: SessionOperationStats) =>
      calculateStarRating(cleared, timeLeft, timeLimit, sessionStats),
    []
  )

  const commitSession = useCallback(
    (stageNumber: number, starRating: StarRating, sessionStats: SessionOperationStats) => {
      // AC-3.2: refから前回セッションを退避（setDataコールバック外で安全に実行）
      setPreviousSessionStats(dataRef.current.lastSessionStats)
      setData(prev => {
        const { next, firstNewBadge } = applyCommitSession(prev, stageNumber, starRating, sessionStats)
        saveGamificationData(next)
        if (firstNewBadge) {
          setTimeout(() => setNewlyEarnedBadge(firstNewBadge), 0)
        }
        return next
      })
    },
    []
  )

  const clearNewBadge = useCallback(() => setNewlyEarnedBadge(null), [])

  const badgeProgress = useMemo(() => buildBadgeProgress(data.cumulativeStats), [data.cumulativeStats])

  const masteryLevels = useMemo(() => calculateAllMasteryLevels(data.cumulativeStats), [data.cumulativeStats])

  const masteryProgress = useMemo(() => {
    const keys = ['click', 'doubleClick', 'rightClick', 'drop'] as const
    const result = {} as UseGamificationReturn['masteryProgress']
    for (const key of keys) {
      result[key] = getProgressToNextLevel(data.cumulativeStats[key].totalSuccess)
    }
    return result
  }, [data.cumulativeStats])

  return {
    stageStars: data.stageStars,
    earnedBadges: data.badges.earnedBadges,
    badgeProgress,
    cumulativeStats: data.cumulativeStats,
    lastSessionStats: data.lastSessionStats,
    previousSessionStats,
    newlyEarnedBadge,
    calculateStarRating: calculateStarRatingCb,
    commitSession,
    clearNewBadge,
    masteryLevels,
    masteryProgress,
    isHydrated,
  }
}
