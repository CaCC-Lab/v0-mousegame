import { InteractionType } from './game'

/** 星評価（0〜3） */
export type StarRating = 0 | 1 | 2 | 3

/** 星評価の判定基準 */
export interface StarCriteria {
  /** ★1: ステージクリア（既存のtargetScore/targetFruitsで判定） */
  star1: 'clear'
  /** ★2: 残り時間の割合閾値（0.0〜1.0） */
  star2TimeRemainingRatio: number
  /** ★3: 最大ミス率（0.0〜1.0） */
  star3MaxMissRate: number
}

/** デフォルトの星評価基準 */
export const DEFAULT_STAR_CRITERIA: StarCriteria = {
  star1: 'clear',
  star2TimeRemainingRatio: 0.2,
  star3MaxMissRate: 0.1,
}

/** 操作別バッジの種類 */
export type BadgeType = 'clickMaster' | 'doubleClickExpert' | 'rightClickPro' | 'dragDoctor'

/** バッジ定義 */
export interface BadgeDefinition {
  type: BadgeType
  name: string
  icon: string
  requiredAction: InteractionType
  threshold: number
}

/** バッジ定義一覧 */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { type: 'clickMaster', name: 'クリック名人', icon: '🖱️', requiredAction: 'click', threshold: 30 },
  { type: 'doubleClickExpert', name: 'ダブルクリック達人', icon: '⚡', requiredAction: 'doubleClick', threshold: 20 },
  { type: 'rightClickPro', name: '右クリックマスター', icon: '🎯', requiredAction: 'rightClick', threshold: 20 },
  { type: 'dragDoctor', name: 'ドラッグ博士', icon: '🧲', requiredAction: 'drop', threshold: 15 },
]

/** 操作別統計（1プレイ分） */
export interface SessionOperationStats {
  click: { success: number; fail: number }
  doubleClick: { success: number; fail: number }
  rightClick: { success: number; fail: number }
  drop: { success: number; fail: number }
}

/** 累計統計 */
export interface CumulativeOperationStats {
  click: { totalSuccess: number; totalFail: number }
  doubleClick: { totalSuccess: number; totalFail: number }
  rightClick: { totalSuccess: number; totalFail: number }
  drop: { totalSuccess: number; totalFail: number }
}

/** 連続成功ボーナスの閾値定義 */
export interface StreakBonus {
  threshold: number
  type: 'smile' | 'bonusFruit' | 'amazing'
  label: string
}

export const STREAK_BONUSES: StreakBonus[] = [
  { threshold: 3, type: 'smile', label: '😊' },
  { threshold: 5, type: 'bonusFruit', label: '🎁' },
  { threshold: 10, type: 'amazing', label: 'すごい！🌟' },
]

/** ステージ別の星評価保存データ */
export interface StageStarData {
  [stageNumber: number]: StarRating
}

/** バッジ獲得データ */
export interface BadgeData {
  earnedBadges: BadgeType[]
  earnedAt: { [key in BadgeType]?: number }
}

/** ゲーミフィケーション永続化データ */
export interface GamificationSaveData {
  stageStars: StageStarData
  badges: BadgeData
  cumulativeStats: CumulativeOperationStats
  lastSessionStats: SessionOperationStats | null
  version: number
}

export const GAMIFICATION_SAVE_VERSION = 1

export const GAMIFICATION_STORAGE_KEY = 'gamificationData'

/** 熟達レベル（1〜5） */
export type MasteryLevel = 1 | 2 | 3 | 4 | 5

/** 熟達レベルの閾値定義 */
export interface MasteryThreshold {
  level: MasteryLevel
  requiredSuccess: number
  label: string
}

export const MASTERY_THRESHOLDS: MasteryThreshold[] = [
  { level: 1, requiredSuccess: 0, label: 'はじめて' },
  { level: 2, requiredSuccess: 10, label: 'できるね' },
  { level: 3, requiredSuccess: 30, label: 'じょうず' },
  { level: 4, requiredSuccess: 60, label: 'すごい' },
  { level: 5, requiredSuccess: 100, label: 'マスター' },
]

/** 操作別の熟達レベルデータ */
export interface OperationMasteryData {
  click: MasteryLevel
  doubleClick: MasteryLevel
  rightClick: MasteryLevel
  drop: MasteryLevel
}
