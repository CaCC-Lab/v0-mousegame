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

#### 7.1a 右クリック・ドラッグの失敗記録（AC-5.2a）

`GamePlayArea` のイベントハンドリングで、操作が不正な対象に行われた場合にも `onFruitClick(fruit, action)` を呼び出す。
- 右クリック: レモン以外のフルーツへの右クリック → `handleFruitInteraction` → `calculateScore === 0` → `recordFailure('rightClick')`
- ドラッグ: スイカ以外のフルーツのドロップ、またはドロップ領域外のリリース → `handleFruitInteraction` → `calculateScore === 0` → `recordFailure('drop')`

### 7.2 ゲーム終了時のフロー

#### 7.2a ステージクリア即終了（AC-1.1a）

1. `handleFruitInteraction` 後にスコア・収穫数を評価
2. ステージクリア条件達成 → `gameState` を `'idle'` に遷移
3. その時点の `timeLeft` で `calculateStarRating` を算出
4. `commitSession` で累計統計更新・バッジ判定・永続化
5. `StageClearModal` + `ResultModal` を表示

#### 7.2b タイマー終了

1. タイマー終了 → `gameState` が `'idle'` に遷移
2. `useStage.checkStageCompletion` でクリア判定（既存）
3. `useGamification.calculateStarRating` で星評価算出（`prevTime` を使用）
4. `useGamification.commitSession` で累計統計更新・バッジ判定・永続化
5. `ResultModal` を表示

### 7.3 連続成功ボーナスの統合

- `StreakIndicator` を `GamePlayArea` 内に配置
- 5回連続成功時のボーナスフルーツは `useGameLogic` の `setFruits` に1個追加
- ストリーク管理は `useOperationStats` の `streak` を Single Source of Truth とし、`useGameLogic` 側の独自ref管理を廃止。`recordSuccess` の戻り値として新しいstreak値を返す

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
| CP-8 | 熟達レベルの単調性 | PBT: `commitSession` 後に任意操作の熟達レベルが減少しないことを検証 |
| CP-9 | 熟達レベルの導出可能性 | 同じ `cumulativeStats` から常に同じ熟達レベルが導出されることを検証 |

## 10. 操作別熟達レベル（Phase 2）

### 10.1 型定義（`types/gamification.ts` に追加）

```typescript
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
```

### 10.2 ビジネスロジック（`lib/gamificationManager.ts` に追加）

```typescript
/** 累計成功回数から熟達レベルを算出（CP-8, CP-9） */
export function calculateMasteryLevel(totalSuccess: number): MasteryLevel {
  // MASTERY_THRESHOLDS を降順に走査し、最初に条件を満たすレベルを返す
}

/** 全操作の熟達レベルを一括算出 */
export function calculateAllMasteryLevels(
  cumulativeStats: CumulativeOperationStats
): OperationMasteryData {
  // 各操作のtotalSuccessからcalculateMasteryLevelを呼び出す
}

/** 次のレベルまでの残り回数を算出 */
export function getProgressToNextLevel(
  totalSuccess: number
): { current: number; nextThreshold: number; remaining: number } | null {
  // 現在のレベルの次の閾値を返す。Lv.5なら null
}
```

### 10.3 フック拡張（`hooks/useGamification.ts`）

`useGamification` の返り値に以下を追加:
- `masteryLevels: OperationMasteryData` — cumulativeStatsから `useMemo` で導出
- `masteryProgress: { [key in InteractionType]: { current: number; nextThreshold: number; remaining: number } | null }` — 進捗情報

### 10.4 UIコンポーネント

#### `components/game/MasteryDisplay.tsx`（新規）
- 4操作の熟達レベル・ラベル・進捗バーを表示
- Props: `masteryLevels`, `masteryProgress`, `cumulativeStats`
- アイドル時に `BadgeDisplay` と並べて表示

#### `components/game/LevelUpNotification.tsx`（新規）
- レベルアップ時の祝福演出
- Props: `operationType`, `newLevel`, `show`
- framer-motion でアニメーション

### 10.5 統合

- `FruitHarvestGame` のアイドル画面に `MasteryDisplay` を配置
- `commitSession` 後にレベルアップを検出し `LevelUpNotification` を表示
- レベルアップ検出: commitSession前後の `calculateAllMasteryLevels` を比較

## 11. ファイル構成

```
types/
  gamification.ts          # 型定義・定数（MasteryLevel, MasteryThreshold 追加）

lib/
  gamificationManager.ts   # ビジネスロジック（calculateMasteryLevel 等追加）

hooks/
  useOperationStats.ts     # 操作別統計・連続成功
  useGamification.ts       # 星・バッジ・累計統計・熟達レベル管理

components/game/
  ResultModal.tsx           # 結果画面
  BadgeDisplay.tsx          # バッジ一覧
  BadgeNotification.tsx     # バッジ獲得演出
  StreakIndicator.tsx       # 連続成功表示
  MasteryDisplay.tsx        # 新規: 操作別熟達レベル一覧
  LevelUpNotification.tsx   # 新規: レベルアップ演出
  StageClearModal.tsx       # 星評価表示
  ScoreBar.tsx              # 連続成功カウント

components/
  FruitHarvestGame.tsx      # フック統合・モーダル追加
```

## 12. きょうのれんしゅう（Phase 2.5）

### 12.1 型定義（`types/gamification.ts` に追加）

```typescript
/** 日付文字列（YYYY-MM-DD） */
export type DateString = string

/** きょうのれんしゅう目標 */
export interface DailyGoal {
  click: boolean
  doubleClick: boolean
  rightClick: boolean
  drop: boolean
}

/** れんしゅうスタンプデータ */
export interface PracticeStampData {
  stamps: DateString[]  // プレイした日付のリスト（昇順、重複なし）
}

/** きょうのれんしゅう永続化データ */
export interface DailyPracticeData {
  todayGoals: DailyGoal
  todayDate: DateString  // 目標が属する日付
  stamps: PracticeStampData
  version: number
}

export const DAILY_PRACTICE_STORAGE_KEY = 'dailyPracticeData'
export const DAILY_PRACTICE_VERSION = 1
```

### 12.2 ビジネスロジック（`lib/dailyPracticeManager.ts` 新規）

```typescript
/** 今日の日付文字列を取得（テスト用にDI可能） */
export function getTodayString(now?: Date): DateString

/** デフォルトのきょうのれんしゅうデータを作成 */
export function createDefaultDailyPracticeData(today?: DateString): DailyPracticeData

/** セッション統計から今日の目標達成状況を判定 */
export function evaluateDailyGoals(sessionStats: SessionOperationStats): DailyGoal

/** 全目標が達成されたか */
export function isDailyGoalComplete(goals: DailyGoal): boolean

/** スタンプを追加（重複排除、CP-10: 不可逆） */
export function addStamp(stamps: PracticeStampData, date: DateString): PracticeStampData

/** 連続日数を算出（CP-11） */
export function calculateStreak(stamps: PracticeStampData, today: DateString): number

/** 永続化：load / save / parse（CP-12: 日付境界安全） */
export function loadDailyPracticeData(storage?: Pick<Storage, 'getItem'>): DailyPracticeData
export function saveDailyPracticeData(data: DailyPracticeData, storage?: Pick<Storage, 'setItem'>): void
export function parseDailyPracticeData(raw: string | null | undefined): DailyPracticeData
```

### 12.3 フック（`hooks/useDailyPractice.ts` 新規）

```typescript
interface UseDailyPracticeReturn {
  todayGoals: DailyGoal
  isGoalComplete: boolean
  practiceStreak: number
  stamps: DateString[]
  /** セッション結果を評価し目標を更新 */
  updateGoals: (sessionStats: SessionOperationStats) => void
  /** 今日のスタンプを押す */
  stampToday: () => void
  isHydrated: boolean
}
```

- `useEffect` でlocalStorageから読み込み、日付が変わっていれば目標をリセット
- `updateGoals` はcommitSession後に呼び出される
- `stampToday` は全目標達成時またはゲーム終了時に呼び出される

### 12.4 UIコンポーネント

#### `components/game/DailyPracticeCard.tsx`（新規）
- 今日の目標と達成状況を表示（4操作のチェックリスト）
- 連続日数バッジ
- Props: `todayGoals`, `isGoalComplete`, `practiceStreak`

#### `components/game/DailyGoalComplete.tsx`（新規）
- 全目標達成時の祝福演出
- Props: `show`, `streak`

### 12.5 統合

- `DailyPracticeCard` はプレイ中も表示（ScoreBar下やGamePlayArea横に配置）
- `handleFruitInteraction` の成功時に即座に `updateGoals` を呼び出し（AC-8.2: リアルタイム更新）
- ゲーム終了時（playing→idle遷移）に `stampToday` を呼び出し（AC-8.4: プレイした日にスタンプ、全目標達成は不要）
- 全目標達成時に `DailyGoalComplete` 祝福演出を表示
- `useDailyPractice` 内で `updateGoals` 呼び出し時に日付変更を検出しリセット（AC-8.7: midnight跨ぎ対応）

## 13. 図鑑 / アルバム（Phase 3）

### 13.1 設計方針

図鑑は**表示専用のビューレイヤー**。新規ビジネスロジックや永続化は不要（CP-13）。
既存データソースから導出する:
- フルーツ図鑑: `gamificationData.cumulativeStats` の各操作の totalSuccess（フルーツ種別と操作が1:1対応）
- バッジ図鑑: `gamificationData.badges.earnedBadges` + `BADGE_DEFINITIONS`
- じゅくたつ図鑑: `useGamification.masteryLevels` + `masteryProgress`
- れんしゅう記録: `useDailyPractice.stamps` + `practiceStreak`

### 13.2 UIコンポーネント

#### `components/game/CollectionModal.tsx`（新規）
- タブ切り替えで4つのセクションを表示
- Props:
  - `open: boolean`
  - `onClose: () => void`
  - `cumulativeStats: CumulativeOperationStats`
  - `harvestedFruits: HarvestedFruits`（全体の累計収穫数）
  - `earnedBadges: BadgeType[]`
  - `masteryLevels: OperationMasteryData`
  - `masteryProgress: UseGamificationReturn['masteryProgress']`
  - `stamps: DateString[]`
  - `practiceStreak: number`

#### タブ構成
1. **フルーツずかん**: 4フルーツの絵文字・名前・累計収穫数。全種収穫済みなら「コンプリート！」
2. **バッジずかん**: BADGE_DEFINITIONS をmap。獲得済み=カラー表示、未獲得=グレーシルエット
3. **じゅくたつ**: MasteryDisplay と同等の情報（再利用）
4. **れんしゅうきろく**: 連続日数 + 直近30日のスタンプカレンダー（日付グリッド、スタンプ日はハイライト）

### 13.3 統合

- `FruitHarvestGame` のアイドル画面に「ずかん」ボタンを追加
- ボタン押下で `CollectionModal` を `open=true` で表示
- Propsは全て既存フック（useGameLogic, useGamification, useDailyPractice）から取得
