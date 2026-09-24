import type { InteractionType } from './game'
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
  // しきい値は v1.2 で「時間をかせぐ型」を入れたあと、腕前つき自動プレイの実測から決め直した（D3、2026-09-24）。
  // beginner 2,170〜3,155 → シルバー、normal 10,765〜17,875 → ゴールド、expert 116,360 → プラチナ。
  // ダイヤは、ミスしない 0.4 秒ごとの自動プレイでも1回目は届かない値（lib/__tests__/rankThresholds.test.ts）
  { id: 'silver', minScore: 2000, emoji: '🥈', label: { ja: 'シルバー', en: 'Silver' } },
  { id: 'gold', minScore: 8000, emoji: '🥇', label: { ja: 'ゴールド', en: 'Gold' } },
  { id: 'platinum', minScore: 30000, emoji: '💠', label: { ja: 'プラチナ', en: 'Platinum' } },
  { id: 'diamond', minScore: 130000, emoji: '💎', label: { ja: 'ダイヤ', en: 'Diamond' } },
] as const

export interface ArcadeConfig {
  /**
   * 開始時の残り時間（秒）。チャレンジは「時間をかせぐ型」（v1.2 D1、docs/game-spec.md §4.2）:
   * 正しく取ると増え、ミスで減り、0 になったら終わる。上手なほど長く遊べる
   */
  startTimeSec: number
  /** 残り時間の上限（秒） */
  maxTimeSec: number
  /** 1つ目を取ったときに増える時間（秒）。取った数が増えるほど減る */
  timeGainBaseSec: number
  /** 1つ取るごとに、増える時間が減る量（秒） */
  timeGainDecayPerHarvest: number
  /** 増える時間の最低値（秒）。上手でもいつかは終わるが、取れば必ず少しは増える */
  timeGainMinSec: number
  /** ミスで減る時間（秒） */
  missPenaltySec: number
  /** この数を取ったら果物が動き出す（難しくなる段差は1か所。v1.2 D2） */
  moveAfterHarvests: number
  /** この時間だけ収穫が途切れるとコンボが切れる（ミリ秒） */
  comboTimeoutMs: number
  /**
   * フィーバーゲージの満タン値。
   *
   * 初見が60秒のあいだに1回は発動できる大きさにする。
   * 100 だったころは、コンボが切れ続けると13回の成功が必要で、
   * 実績（60秒で成功5〜6回）では届きようがなかった
   * （プレイテストで「バーは半分くらいまで行ったけど発動しなかった」）。
   * 必要回数は lib/__tests__/feverReachability.test.ts で固定している。
   */
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
  // 時間の数値は、腕前つき自動プレイで「初心者 60〜90 秒・ふつう 2〜3 分・上手 4 分以上」
  // になるよう計算で当たりを付けた値（docs/v1.2-plan.md）。実測で決め直してよい
  startTimeSec: 35,
  maxTimeSec: 60,
  timeGainBaseSec: 1.8,
  timeGainDecayPerHarvest: 0.01,
  timeGainMinSec: 0.3,
  missPenaltySec: 2,
  moveAfterHarvests: 25,
  comboTimeoutMs: 2500,
  feverGaugeMax: 50,
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
  /**
   * ミスがいちばん多かった果物の正しい操作（「にがてな そうさ」。v1.2 D4）。ミスが無ければ null。
   * useArcadeMode.commitResult の後で useGameLogic が埋める
   */
  weakOperation?: InteractionType | null
  /** 終わった理由（v1.2 G3）。チャレンジは時間をかせぐ型なので、終わり方は時間切れだけ */
  endReason?: 'timeUp'
  /** 今回続いた時間（ゲーム内の秒）。「◯びょう つづいた！」に使う */
  playedSec?: number
}

export interface RankProgress {
  current: RankTierId
  next: RankTierId | null
  /** 次の段位まであと何点か（最高段位なら0） */
  pointsToNext: number
  /** 現在の段位区間の進捗（0〜1、最高段位なら1） */
  ratio: number
}
