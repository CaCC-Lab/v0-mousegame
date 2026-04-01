# ゲーミフィケーション機能 技術設計

## 1. 概要

既存のマウス操作学習アプリに「熟達可視化型ゲーミフィケーション」を追加する。
既存アーキテクチャ（React hooks + StageManager + localStorage）を活かし、最小限の変更で統合する。

## 2. アーキテクチャ概要

```
┌─────────────────────────────────────────────────┐
│                FruitHarvestGame                  │
│  ┌───────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ ScoreBar  │  │ GamePlayArea │  │ResultModal│ │
│  │(星・連続) │  │(連続演出)    │  │(結果画面) │ │
│  └───────────┘  └──────────────┘  └───────────┘ │
│  ┌──────────────┐  ┌──────────────────────────┐  │
│  │BadgeDisplay  │  │StageClearModal(星表示)   │  │
│  └──────────────┘  └──────────────────────────┘  │
├─────────────────────────────────────────────────┤
│              useGameLogic (既存)                  │
│  ┌──────────────┐  ┌──────────────────────────┐  │
│  │useGamification│  │useOperationStats        │  │
│  │(星・バッジ)  │  │(操作別統計・連続成功)   │  │
│  └──────────────┘  └──────────────────────────┘  │
├─────────────────────────────────────────────────┤
│           lib/gamificationManager.ts             │
│  (星評価計算・バッジ判定・データ永続化)          │
├─────────────────────────────────────────────────┤
│              localStorage                        │
│  gamificationData (星・バッジ・累計統計)          │
└─────────────────────────────────────────────────┘
```

## 3. データモデル

### 3.1 新規型定義 (`types/gamification.ts`)

```typescript
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
  earnedAt: { [key in BadgeType]?: number } // timestamp
}

/** ゲーミフィケーション永続化データ */
export interface GamificationSaveData {
  stageStars: StageStarData
  badges: BadgeData
  cumulativeStats: CumulativeOperationStats
  lastSessionStats: SessionOperationStats | null
  version: number // スキーマバージョン
}

export const GAMIFICATION_SAVE_VERSION = 1

export const GAMIFICATION_STORAGE_KEY = 'gamificationData'
```

### 3.2 既存型への変更

既存の `Stage` 型や `StageManager` には変更を加えない。
星評価基準は `DEFAULT_STAR_CRITERIA` をデフォルトとし、将来的にステージごとのカスタマイズが必要になった場合に `Stage` 型を拡張する。

## 4. コンポーネント設計

### 4.1 新規コンポーネント

#### `components/game/ResultModal.tsx`
- ゲーム終了時に表示する結果画面
- Props: `SessionOperationStats`, `StarRating`, `lastSessionStats`, 励ましメッセージ
- 操作別の成功回数、前回比較（↑↓）、星評価、励ましメッセージを表示

#### `components/game/BadgeDisplay.tsx`
- バッジ一覧表示コンポーネント
- Props: `earnedBadges`, `cumulativeStats`, `BadgeDefinition[]`
- 獲得済みバッジと進捗バーを表示

#### `components/game/BadgeNotification.tsx`
- バッジ獲得時の祝福演出
- Props: `badge: BadgeDefinition`, `show: boolean`
- framer-motion でアニメーション表示

#### `components/game/StreakIndicator.tsx`
- 連続成功数のリアルタイム表示と演出
- Props: `streak: number`, `lastBonus: StreakBonus | null`
- 3/5/10回到達時の演出を含む

### 4.2 既存コンポーネントの変更

#### `components/game/StageClearModal.tsx`
- 星評価（★表示）を追加
- Props に `starRating: StarRating` を追加

#### `components/game/ScoreBar.tsx`
- 連続成功カウントの表示を追加
- Props に `streak: number` を追加

#### `components/FruitHarvestGame.tsx`
- `useGamification` と `useOperationStats` フックを統合
- ゲーム終了時に `ResultModal` を表示
- バッジ獲得時に `BadgeNotification` を表示

## 5. フック設計

### 5.1 `hooks/useOperationStats.ts`

操作別の成功・失敗をトラッキングするフック。

```typescript
interface UseOperationStatsReturn {
  /** 現在のセッション統計 */
  sessionStats: SessionOperationStats
  /** 連続成功カウント */
  streak: number
  /** 最後にトリガーされたストリークボーナス */
  lastStreakBonus: StreakBonus | null
  /** 操作成功を記録 */
  recordSuccess: (action: InteractionType) => void
  /** 操作失敗を記録 */
  recordFailure: (action: InteractionType) => void
  /** セッション統計をリセット */
  resetSession: () => void
}
```

- `recordSuccess`: 該当操作の成功カウントを+1、streak を+1、ストリークボーナス判定
- `recordFailure`: 該当操作の失敗カウントを+1、streak を0にリセット
- `resetSession`: 新しいゲーム開始時にセッション統計をクリア

### 5.2 `hooks/useGamification.ts`

星評価・バッジ・累計統計を管理するフック。

```typescript
interface UseGamificationReturn {
  /** ステージ別の星評価 */
  stageStars: StageStarData
  /** 獲得済みバッジ */
  earnedBadges: BadgeType[]
  /** バッジ進捗 */
  badgeProgress: { [key in BadgeType]: { current: number; target: number } }
  /** 累計統計 */
  cumulativeStats: CumulativeOperationStats
  /** 前回セッション統計 */
  lastSessionStats: SessionOperationStats | null
  /** 新しく獲得したバッジ（演出用） */
  newlyEarnedBadge: BadgeDefinition | null
  /** 星評価を計算 */
  calculateStarRating: (
    stageNumber: number,
    cleared: boolean,
    timeLeft: number,
    timeLimit: number,
    sessionStats: SessionOperationStats
  ) => StarRating
  /** セッション結果を確定（累計統計に加算、バッジ判定） */
  commitSession: (stageNumber: number, starRating: StarRating, sessionStats: SessionOperationStats) => void
  /** 新規バッジ通知をクリア */
  clearNewBadge: () => void
  /** データ初期化済みか */
  isHydrated: boolean
}
```

- `calculateStarRating`: ステージクリア状況・残り時間・ミス率から★を算出
- `commitSession`: セッション統計を累計に加算、バッジ閾値チェック、星評価保存（単調性保証）
- localStorage への保存は `commitSession` 時に一括で行う

## 6. ビジネスロジック (`lib/gamificationManager.ts`)

### 6.1 星評価計算

```typescript
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

  let stars: StarRating = 1 // クリアで★1確定

  if (timeRemainingRatio >= criteria.star2TimeRemainingRatio) {
    stars = 2
  }

  // ★3は★2の条件も満たす必要がある
  if (stars === 2 && missRate <= criteria.star3MaxMissRate) {
    stars = 3
  }

  return stars
}
```

### 6.2 バッジ判定

```typescript
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
```

### 6.3 永続化

```typescript
export function loadGamificationData(): GamificationSaveData {
  // localStorage から読み込み、バージョンチェック、デフォルト値フォールバック
}

export function saveGamificationData(data: GamificationSaveData): void {
  // JSON.stringify して localStorage に保存
}

export function createDefaultGamificationData(): GamificationSaveData {
  // 初期値を返す
}
```

## 7. 既存コードとの統合ポイント

### 7.1 `handleFruitInteraction` の拡張

`useGameLogic.ts` の `handleFruitInteraction` で、操作の成功・失敗を `useOperationStats` に記録する。

- `calculateScore` の戻り値 > 0 → `recordSuccess(action)`
- `calculateScore` の戻り値 === 0 → `recordFailure(action)`

### 7.2 ゲーム終了時のフロー

1. タイマー終了 → `gameState` が `'idle'` に遷移
2. `useStage.checkStageCompletion` でクリア判定（既存）
3. `useGamification.calculateStarRating` で星評価算出
4. `useGamification.commitSession` で累計統計更新・バッジ判定・永続化
5. `ResultModal` を表示

### 7.3 連続成功ボーナスの統合

- `StreakIndicator` を `GamePlayArea` 内に配置
- 5回連続成功時のボーナスフルーツは `useGameLogic` の `setFruits` に1個追加

## 8. localStorage キー設計

| キー | 内容 | 形式 |
|------|------|------|
| `gamificationData` | 星・バッジ・累計統計 | `GamificationSaveData` JSON |
| `stageProgress` | ステージ進捗（既存） | `StageProgress` JSON |
| `stage{N}HighScore` | ステージ別ハイスコア（既存） | number string |
| `fruitHarvestHighScore` | 全体ハイスコア（既存） | number |

既存キーには一切変更を加えない。`gamificationData` キーを新規追加する。

## 9. 正確性プロパティとテスト方針

| ID | プロパティ | テスト方法 |
|----|-----------|-----------|
| CP-1 | 星評価の単調性 | PBT: 任意の `commitSession` 呼び出し列に対して、各ステージの星評価が減少しないことを検証 |
| CP-2 | バッジの不可逆性 | PBT: `commitSession` 後に `earnedBadges` から要素が消えないことを検証 |
| CP-3 | 統計の非負性 | PBT: 任意の `recordSuccess`/`recordFailure` 列に対して全カウンタ ≥ 0 |
| CP-4 | 連続成功カウントの整合性 | PBT: `recordFailure` 後に streak === 0、`recordSuccess` 後に streak が前回+1 |
| CP-5 | 累計統計の単調増加 | PBT: `commitSession` 前後で累計値が減少しないことを検証 |
| CP-6 | 永続化の冪等性 | PBT: `save` → `load` → `save` → `load` で同一データが得られる |
| CP-7 | デシリアライズの安全性 | PBT: 任意の文字列入力に対して `loadGamificationData` がクラッシュしない |

## 10. ファイル構成

```
types/
  gamification.ts          # 新規: 型定義・定数

lib/
  gamificationManager.ts   # 新規: 星評価計算・バッジ判定・永続化

hooks/
  useOperationStats.ts     # 新規: 操作別統計・連続成功
  useGamification.ts       # 新規: 星・バッジ・累計統計管理

components/game/
  ResultModal.tsx           # 新規: 結果画面
  BadgeDisplay.tsx          # 新規: バッジ一覧
  BadgeNotification.tsx     # 新規: バッジ獲得演出
  StreakIndicator.tsx       # 新規: 連続成功表示
  StageClearModal.tsx       # 変更: 星評価表示追加
  ScoreBar.tsx              # 変更: 連続成功カウント追加

components/
  FruitHarvestGame.tsx      # 変更: フック統合・モーダル追加
```
