/**
 * アーケードモード（60秒スコアアタック）の型と設定。
 *
 * 既存の「れんしゅうモード」（ステージ制）とは別の遊び方として足すもので、
 * 練習側の型（types/stage.ts / types/gamification.ts）には手を入れない。
 */

export type GameMode = 'practice' | 'arcade'

export type RankTierId = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

export interface RankTier {
  id: RankTierId
  /** この段位に到達する最低スコア */
  minScore: number
  /** 段位バッジの絵文字（読み上げには label を使う） */
  emoji: string
  label: { ja: string; en: string }
}

/**
 * 段位のしきい値。
 * Issue #42 の「Bronze→Silver→Gold」を骨格に、
 * 上手いプレイヤーが数回で頭打ちにならないよう Platinum / Diamond まで伸ばしている。
 */
export const RANK_TIERS: readonly RankTier[] = [
  { id: 'bronze', minScore: 0, emoji: '🥉', label: { ja: 'ブロンズ', en: 'Bronze' } },
  { id: 'silver', minScore: 1000, emoji: '🥈', label: { ja: 'シルバー', en: 'Silver' } },
  { id: 'gold', minScore: 2500, emoji: '🥇', label: { ja: 'ゴールド', en: 'Gold' } },
  { id: 'platinum', minScore: 4500, emoji: '💠', label: { ja: 'プラチナ', en: 'Platinum' } },
  { id: 'diamond', minScore: 7000, emoji: '💎', label: { ja: 'ダイヤ', en: 'Diamond' } },
] as const

export interface ArcadeConfig {
  /** 1プレイの長さ（秒） */
  duration: number
  /** この時間だけ収穫が途切れるとコンボが切れる（ミリ秒） */
  comboTimeoutMs: number
  /** フィーバーゲージの満タン値 */
  feverGaugeMax: number
  /** 収穫1回あたりのゲージ増加の基礎値 */
  feverGainBase: number
  /** コンボ倍率1につき上乗せされるゲージ増加 */
  feverGainPerMultiplier: number
  /** フィーバーの継続時間（ミリ秒） */
  feverDurationMs: number
  /** フィーバー中のスコア倍率（コンボ倍率にさらに乗る） */
  feverScoreMultiplier: number
  /** 同時に出しておくフルーツの数 */
  fruitCount: number
  /** フィーバー中に増えるぶんを含めたフルーツ数の上限 */
  maxFruits: number
}

export const ARCADE_CONFIG: ArcadeConfig = {
  duration: 60,
  comboTimeoutMs: 2500,
  feverGaugeMax: 100,
  feverGainBase: 6,
  feverGainPerMultiplier: 2,
  feverDurationMs: 8000,
  feverScoreMultiplier: 2,
  fruitCount: 12,
  maxFruits: 20,
}

/** コンボ数 → 倍率のしきい値（昇順） */
export const COMBO_STEPS: readonly { minCount: number; multiplier: number }[] = [
  { minCount: 0, multiplier: 1 },
  { minCount: 3, multiplier: 2 },
  { minCount: 6, multiplier: 3 },
  { minCount: 10, multiplier: 4 },
  { minCount: 15, multiplier: 5 },
] as const

export interface ArcadeResult {
  score: number
  best: number
  isNewBest: boolean
  maxCombo: number
  feverCount: number
  rank: RankTierId
}

export interface RankProgress {
  current: RankTierId
  next: RankTierId | null
  /** 次の段位まであと何点か（最高段位なら0） */
  pointsToNext: number
  /** 現在の段位区間の進捗（0〜1、最高段位なら1） */
  ratio: number
}
