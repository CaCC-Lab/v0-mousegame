import {
  BADGE_DEFINITIONS,
  BadgeType,
  CumulativeOperationStats,
  DEFAULT_STAR_CRITERIA,
  GamificationSaveData,
  GAMIFICATION_SAVE_VERSION,
  GAMIFICATION_STORAGE_KEY,
  MASTERY_THRESHOLDS,
  MasteryLevel,
  OperationMasteryData,
  SessionOperationStats,
  StarCriteria,
  StarRating,
  StageStarData,
} from '@/types/gamification'

const INTERACTION_KEYS = ['click', 'doubleClick', 'rightClick', 'drop'] as const

export function createEmptySessionStats(): SessionOperationStats {
  return {
    click: { success: 0, fail: 0 },
    doubleClick: { success: 0, fail: 0 },
    rightClick: { success: 0, fail: 0 },
    drop: { success: 0, fail: 0 },
  }
}

export function createDefaultCumulativeStats(): CumulativeOperationStats {
  return {
    click: { totalSuccess: 0, totalFail: 0 },
    doubleClick: { totalSuccess: 0, totalFail: 0 },
    rightClick: { totalSuccess: 0, totalFail: 0 },
    drop: { totalSuccess: 0, totalFail: 0 },
  }
}

export function createDefaultGamificationData(): GamificationSaveData {
  return {
    stageStars: {},
    badges: { earnedBadges: [], earnedAt: {} },
    cumulativeStats: createDefaultCumulativeStats(),
    lastSessionStats: null,
    version: GAMIFICATION_SAVE_VERSION,
  }
}

export function sumAllAttempts(stats: SessionOperationStats): number {
  let total = 0
  for (const key of INTERACTION_KEYS) {
    total += stats[key].success + stats[key].fail
  }
  return total
}

export function sumAllFails(stats: SessionOperationStats): number {
  let total = 0
  for (const key of INTERACTION_KEYS) {
    total += stats[key].fail
  }
  return total
}

export function calculateStarRating(
  cleared: boolean,
  timeLeft: number,
  timeLimit: number,
  sessionStats: SessionOperationStats,
  criteria: StarCriteria = DEFAULT_STAR_CRITERIA
): StarRating {
  if (!cleared) return 0

  const totalAttempts = sumAllAttempts(sessionStats)
  const totalFails = sumAllFails(sessionStats)
  const missRate = totalAttempts > 0 ? totalFails / totalAttempts : 0
  const timeRemainingRatio = timeLimit > 0 ? timeLeft / timeLimit : 0

  let stars: StarRating = 1

  if (timeRemainingRatio >= criteria.star2TimeRemainingRatio) {
    stars = 2
  }

  if (stars === 2 && missRate <= criteria.star3MaxMissRate) {
    stars = 3
  }

  return stars
}

export function checkBadgeEarned(
  cumulativeStats: CumulativeOperationStats,
  earnedBadges: BadgeType[]
): BadgeType | null {
  for (const def of BADGE_DEFINITIONS) {
    if (earnedBadges.includes(def.type)) continue
    const stat = cumulativeStats[def.requiredAction]
    if (stat.totalSuccess >= def.threshold) {
      return def.type
    }
  }
  return null
}

export function mergeStageStarsMonotonic(
  existing: StageStarData,
  stageNumber: number,
  newRating: StarRating
): StageStarData {
  const prev = (existing[stageNumber] ?? 0) as StarRating
  return {
    ...existing,
    [stageNumber]: Math.max(prev, newRating) as StarRating,
  }
}

export function addSessionToCumulative(
  cumulative: CumulativeOperationStats,
  session: SessionOperationStats
): CumulativeOperationStats {
  const next = createDefaultCumulativeStats()
  for (const key of INTERACTION_KEYS) {
    next[key].totalSuccess = cumulative[key].totalSuccess + session[key].success
    next[key].totalFail = cumulative[key].totalFail + session[key].fail
  }
  return next
}

function isNonNegativeInt(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && Math.floor(n) === n
}

function coerceSessionStats(input: unknown): SessionOperationStats {
  const empty = createEmptySessionStats()
  if (!input || typeof input !== 'object') return empty
  const o = input as Record<string, unknown>
  for (const key of INTERACTION_KEYS) {
    const block = o[key]
    if (!block || typeof block !== 'object') continue
    const b = block as Record<string, unknown>
    empty[key] = {
      success: isNonNegativeInt(b.success) ? b.success : 0,
      fail: isNonNegativeInt(b.fail) ? b.fail : 0,
    }
  }
  return empty
}

function coerceCumulativeStats(input: unknown): CumulativeOperationStats {
  const empty = createDefaultCumulativeStats()
  if (!input || typeof input !== 'object') return empty
  const o = input as Record<string, unknown>
  for (const key of INTERACTION_KEYS) {
    const block = o[key]
    if (!block || typeof block !== 'object') continue
    const b = block as Record<string, unknown>
    empty[key] = {
      totalSuccess: isNonNegativeInt(b.totalSuccess) ? b.totalSuccess : 0,
      totalFail: isNonNegativeInt(b.totalFail) ? b.totalFail : 0,
    }
  }
  return empty
}

function coerceStageStars(input: unknown): StageStarData {
  if (!input || typeof input !== 'object') return {}
  const out: StageStarData = {}
  for (const [k, v] of Object.entries(input)) {
    const num = Number(k)
    if (!Number.isFinite(num)) continue
    if (typeof v === 'number' && v >= 1 && v <= 3) {
      out[num] = Math.floor(v) as StarRating
    }
  }
  return out
}

function coerceBadges(input: unknown): GamificationSaveData['badges'] {
  const defaults = { earnedBadges: [] as BadgeType[], earnedAt: {} as GamificationSaveData['badges']['earnedAt'] }
  if (!input || typeof input !== 'object') return defaults
  const o = input as Record<string, unknown>
  const earnedBadges = Array.isArray(o.earnedBadges)
    ? o.earnedBadges.filter((b): b is BadgeType => typeof b === 'string' && BADGE_DEFINITIONS.some(d => d.type === b))
    : []
  const earnedAt: GamificationSaveData['badges']['earnedAt'] = {}
  if (o.earnedAt && typeof o.earnedAt === 'object') {
    for (const def of BADGE_DEFINITIONS) {
      const ts = (o.earnedAt as Record<string, unknown>)[def.type]
      if (typeof ts === 'number' && Number.isFinite(ts)) {
        earnedAt[def.type] = ts
      }
    }
  }
  return { earnedBadges, earnedAt }
}

export function parseGamificationData(raw: string | null | undefined): GamificationSaveData {
  const base = createDefaultGamificationData()
  if (raw == null || raw === '') return base

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return base
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return base
  const o = parsed as Record<string, unknown>

  return {
    stageStars: coerceStageStars(o.stageStars),
    badges: coerceBadges(o.badges),
    cumulativeStats: coerceCumulativeStats(o.cumulativeStats),
    lastSessionStats: o.lastSessionStats === null ? null : coerceSessionStats(o.lastSessionStats),
    version: typeof o.version === 'number' && Number.isFinite(o.version) ? Math.floor(o.version) : GAMIFICATION_SAVE_VERSION,
  }
}

export function loadGamificationData(
  storage: Pick<Storage, 'getItem'> = typeof window !== 'undefined' ? localStorage : { getItem: () => null }
): GamificationSaveData {
  try {
    const raw = storage.getItem(GAMIFICATION_STORAGE_KEY)
    return parseGamificationData(raw)
  } catch {
    return createDefaultGamificationData()
  }
}

export function saveGamificationData(
  data: GamificationSaveData,
  storage: Pick<Storage, 'setItem'> = typeof window !== 'undefined' ? localStorage : { setItem: () => {} }
): void {
  try {
    storage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // クォータ超過等は握りつぶし（AC-6.3）
  }
}

export function getEncouragementMessage(starRating: StarRating): string {
  if (starRating >= 3) return 'すごい！次もがんばろう！'
  if (starRating === 2) return 'よくできました！もう少し！'
  if (starRating === 1) return 'クリアおめでとう！'
  return 'れんしゅうのきろくだよ'
}

export type OperationDelta = 'up' | 'down' | 'same'

export function compareSessionSuccess(
  current: SessionOperationStats,
  previous: SessionOperationStats | null
): Record<keyof SessionOperationStats, OperationDelta> {
  const out = {} as Record<keyof SessionOperationStats, OperationDelta>
  for (const key of INTERACTION_KEYS) {
    if (!previous) {
      out[key] = 'same'
      continue
    }
    const d = current[key].success - previous[key].success
    out[key] = d > 0 ? 'up' : d < 0 ? 'down' : 'same'
  }
  return out
}

export function calculateMasteryLevel(totalSuccess: number): MasteryLevel {
  let level: MasteryLevel = 1
  for (const t of MASTERY_THRESHOLDS) {
    if (totalSuccess >= t.requiredSuccess) {
      level = t.level
    }
  }
  return level
}

export function calculateAllMasteryLevels(cumulativeStats: CumulativeOperationStats): OperationMasteryData {
  return {
    click: calculateMasteryLevel(cumulativeStats.click.totalSuccess),
    doubleClick: calculateMasteryLevel(cumulativeStats.doubleClick.totalSuccess),
    rightClick: calculateMasteryLevel(cumulativeStats.rightClick.totalSuccess),
    drop: calculateMasteryLevel(cumulativeStats.drop.totalSuccess),
  }
}

export function getProgressToNextLevel(
  totalSuccess: number
): { current: number; nextThreshold: number; remaining: number } | null {
  const currentLevel = calculateMasteryLevel(totalSuccess)
  const nextThreshold = MASTERY_THRESHOLDS.find(t => t.level === (currentLevel + 1) as MasteryLevel)
  if (!nextThreshold) return null
  return {
    current: totalSuccess,
    nextThreshold: nextThreshold.requiredSuccess,
    remaining: nextThreshold.requiredSuccess - totalSuccess,
  }
}
