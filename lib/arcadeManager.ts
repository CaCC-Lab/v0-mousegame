import {
  ARCADE_CONFIG,
  COMBO_STEPS,
  RANK_TIERS,
  RankTierId,
  RankProgress,
} from '@/types/arcade'

/**
 * コンボ数からスコア倍率を求める。
 * しきい値を跨ぐたびに倍率が1段上がり、最大倍率で頭打ちになる。
 */
export function getComboMultiplier(comboCount: number): number {
  let multiplier = COMBO_STEPS[0].multiplier

  for (const step of COMBO_STEPS) {
    if (comboCount >= step.minCount) {
      multiplier = step.multiplier
    }
  }

  return multiplier
}

/**
 * 最後の収穫からの経過時間でコンボが切れたかを判定する。
 * lastHarvestAt が 0（まだ1度も収穫していない）なら切れていない扱いにして、
 * ゲーム開始直後にコンボ表示がちらつかないようにする。
 */
export function isComboExpired(lastHarvestAt: number, now: number): boolean {
  if (lastHarvestAt <= 0) return false
  return now - lastHarvestAt > ARCADE_CONFIG.comboTimeoutMs
}

/**
 * アーケードモードの獲得点数。
 * 基礎点 × コンボ倍率 ×（フィーバー中ならさらにフィーバー倍率）。
 */
export function calculateArcadePoints(
  basePoints: number,
  comboMultiplier: number,
  isFever: boolean
): number {
  const feverMultiplier = isFever ? ARCADE_CONFIG.feverScoreMultiplier : 1
  return Math.floor(basePoints * comboMultiplier * feverMultiplier)
}

/**
 * 収穫でフィーバーゲージを溜める。コンボ倍率が高いほど早く溜まる。
 */
export function gainFeverGauge(currentGauge: number, comboMultiplier: number): number {
  const gain = ARCADE_CONFIG.feverGainBase + comboMultiplier * ARCADE_CONFIG.feverGainPerMultiplier
  return Math.min(ARCADE_CONFIG.feverGaugeMax, currentGauge + gain)
}

/**
 * フィーバー中のゲージ減少。継続時間ぶん経過するとちょうど0になる。
 */
export function drainFeverGauge(currentGauge: number, deltaMs: number): number {
  const drainPerMs = ARCADE_CONFIG.feverGaugeMax / ARCADE_CONFIG.feverDurationMs
  return Math.max(0, currentGauge - deltaMs * drainPerMs)
}

/** ゲージが満タン＝フィーバー突入可能 */
export function isFeverReady(gauge: number): boolean {
  return gauge >= ARCADE_CONFIG.feverGaugeMax
}

/** スコアから段位を求める */
export function getRank(score: number): RankTierId {
  let rank: RankTierId = RANK_TIERS[0].id

  for (const tier of RANK_TIERS) {
    if (score >= tier.minScore) {
      rank = tier.id
    }
  }

  return rank
}

/** 段位と、次の段位までの進捗 */
export function getRankProgress(score: number): RankProgress {
  const current = getRank(score)
  const currentIndex = RANK_TIERS.findIndex(tier => tier.id === current)
  const nextTier = RANK_TIERS[currentIndex + 1]

  if (!nextTier) {
    return { current, next: null, pointsToNext: 0, ratio: 1 }
  }

  const floor = RANK_TIERS[currentIndex].minScore
  const span = nextTier.minScore - floor
  const ratio = span > 0 ? Math.min(1, Math.max(0, (score - floor) / span)) : 0

  return {
    current,
    next: nextTier.id,
    pointsToNext: Math.max(0, nextTier.minScore - score),
    ratio,
  }
}

/**
 * 自己ベスト更新かどうか。
 * 0点は「遊んでいない」と区別できないので更新扱いにしない。
 */
export function isNewBest(score: number, best: number): boolean {
  return score > 0 && score > best
}
