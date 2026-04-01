# ゲーミフィケーション機能 実装タスク

## タスク一覧

- [ ] 1. 型定義の作成
  - [ ] 1.1 `types/gamification.ts` を作成し、StarRating, StarCriteria, BadgeType, BadgeDefinition, SessionOperationStats, CumulativeOperationStats, StreakBonus, StageStarData, BadgeData, GamificationSaveData の型と定数を定義する
  - [ ] 1.2 型定義の整合性を確認（既存の InteractionType との連携）

- [ ] 2. ビジネスロジックの実装
  - [ ] 2.1 `lib/gamificationManager.ts` を作成し、以下の関数を実装する
    - `calculateStarRating`: クリア状況・残り時間・ミス率から★1〜★3を算出
    - `checkBadgeEarned`: 累計統計とバッジ定義から新規獲得バッジを判定
    - `loadGamificationData`: localStorage からデータ読み込み（バージョンチェック・フォールバック付き）
    - `saveGamificationData`: localStorage へデータ保存
    - `createDefaultGamificationData`: 初期値生成
    - `mergeCumulativeStats`: セッション統計を累計統計に加算
  - [ ] 2.2 `lib/__tests__/gamificationManager.test.ts` を作成し、以下の正確性プロパティをPBTで検証する
    - CP-1: 星評価の単調性（commitSession 呼び出し列で星評価が減少しない）
    - CP-3: 統計の非負性（全カウンタ ≥ 0）
    - CP-5: 累計統計の単調増加（mergeCumulativeStats 前後で減少しない）
    - CP-6: 永続化の冪等性（save → load → save → load で同一データ）
    - CP-7: デシリアライズの安全性（任意文字列入力でクラッシュしない）

- [ ] 3. useOperationStats フックの実装
  - [ ] 3.1 `hooks/useOperationStats.ts` を作成し、セッション統計・連続成功カウント・ストリークボーナス判定を実装する
  - [ ] 3.2 `hooks/__tests__/useOperationStats.test.ts` を作成し、以下を検証する
    - CP-4: 連続成功カウントの整合性（recordFailure 後に streak === 0、recordSuccess 後に streak が +1）
    - recordSuccess で該当操作の成功カウントが +1 される
    - recordFailure で該当操作の失敗カウントが +1 される
    - resetSession でセッション統計と streak がリセットされる
    - ストリークボーナスの閾値判定（3, 5, 10回）

- [ ] 4. useGamification フックの実装
  - [ ] 4.1 `hooks/useGamification.ts` を作成し、星評価・バッジ・累計統計の管理と localStorage 永続化を実装する
  - [ ] 4.2 `hooks/__tests__/useGamification.test.ts` を作成し、以下を検証する
    - CP-1: 星評価の単調性（低い星評価で上書きされない）
    - CP-2: バッジの不可逆性（commitSession 後に earnedBadges から要素が消えない）
    - CP-5: 累計統計の単調増加
    - commitSession でセッション統計が累計に加算される
    - バッジ獲得時に newlyEarnedBadge が設定される
    - isHydrated が localStorage 読み込み後に true になる

- [ ] 5. 新規UIコンポーネントの実装
  - [ ] 5.1 `components/game/StreakIndicator.tsx` を作成し、連続成功数のリアルタイム表示と 3/5/10 回到達時の演出を実装する
  - [ ] 5.2 `components/game/ResultModal.tsx` を作成し、ゲーム終了時の結果画面（操作別統計・前回比較・星評価・励ましメッセージ）を実装する
  - [ ] 5.3 `components/game/BadgeDisplay.tsx` を作成し、バッジ一覧と進捗バーの表示を実装する
  - [ ] 5.4 `components/game/BadgeNotification.tsx` を作成し、バッジ獲得時の祝福演出を実装する
  - [ ] 5.5 新規コンポーネントのテストを作成する

- [ ] 6. 既存コンポーネントの変更
  - [ ] 6.1 `components/game/StageClearModal.tsx` に星評価（★表示）を追加する
  - [ ] 6.2 `components/game/ScoreBar.tsx` に連続成功カウントの表示を追加する
  - [ ] 6.3 変更したコンポーネントの既存テストを更新する

- [ ] 7. useGameLogic の拡張
  - [ ] 7.1 `hooks/useGameLogic.ts` の `handleFruitInteraction` に操作統計記録（recordSuccess / recordFailure）を追加する
  - [ ] 7.2 ゲーム終了時のフローに星評価算出・commitSession・ResultModal 表示を追加する
  - [ ] 7.3 5回連続成功時のボーナスフルーツ出現ロジックを追加する
  - [ ] 7.4 useGameLogic の既存テストを更新し、新規ロジックのテストを追加する

- [ ] 8. FruitHarvestGame への統合
  - [ ] 8.1 `components/FruitHarvestGame.tsx` に useGamification と useOperationStats フックを統合する
  - [ ] 8.2 ゲーム終了時に ResultModal を表示する
  - [ ] 8.3 バッジ獲得時に BadgeNotification を表示する
  - [ ] 8.4 StreakIndicator を GamePlayArea 内に配置する
  - [ ] 8.5 BadgeDisplay をゲーム画面に配置する（アイドル時に表示）
  - [ ] 8.6 統合テストを更新する
