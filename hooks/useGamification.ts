'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  BadgeDefinition,
  BadgeType,
  CumulativeOperationStats,
  GamificationSaveData,
  SessionOperationStats,
  StarRating,
  StageStarData,
} from '@/types/gamification'
import { BADGE_DEFINITIONS } from '@/types/gamification'
import {
  addSessionToCumulative,
  calculateStarRating,
  checkBadgeEarned,
  createDefaultGamificationData,
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

  return {
    stageStars: data.stageStars,
    earnedBadges: data.badges.earnedBadges,
    badgeProgress,
    cumulativeStats: data.cumulativeStats,
    lastSessionStats: data.lastSessionStats,
    newlyEarnedBadge,
    calculateStarRating: calculateStarRatingCb,
    commitSession,
    clearNewBadge,
    isHydrated,
  }
}
