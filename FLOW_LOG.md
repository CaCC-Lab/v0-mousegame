# FLOW_LOG: フルーツハーベストゲーム - ゲーミフィケーション機能

## 概要
- 開始日: 2026-04-01
- 目標: 熟達可視化型ゲーミフィケーション（星評価・バッジ・操作別統計）の実装
- フロー: v7.8.4a（v7.5 GitHub PR運用）
- リポジトリ: https://github.com/CaCC-Lab/v0-mousegame
- 主要 feature spec: `.kiro/specs/gamification/`
- 基盤 steering: `product.md / tech.md / structure.md`
- 使用MCP: Playwright（Runtime Verification、CLI経由）
- PR: https://github.com/CaCC-Lab/v0-mousegame/pull/1

---

## Day 1 (2026-04-01)

### 実施フェーズ
- [x] Phase 1: Kiro Spec作成・同期（既存Spec確認）
- [x] Phase 2: featureブランチ作成（Spec commit）
- [x] Phase 2.5: Spec Sync Gate — PASS
- [x] Phase 3: テスト作成（Canon TDD違反あり→是正済み）
- [x] Phase 4: 実装（Claude Code）— 全70テストPASS
- [x] Phase 4.5: /simplify — ResultModal重複コード統一
- [x] Phase 4.6: Runtime Verification — E2E 3/8 PASS（失敗5件は既存問題）
- [x] Phase 5: pre-commit — ゲーミフィケーション関連70テスト全PASS
- [x] Phase 6: PR作成 → GitHub CI — 全緑
- [x] Phase 7: 自動レビュー — CodeRabbit pass / Devin pass
- [x] Phase 9a: Codex — P1-2/P1-3修正済み
- [x] Phase 9b: 補完レビュー — P1修正済み
- [x] Phase 10: Merge — Squash and merge 完了

### Spec同期記録
| 項目 | 値 |
|------|-----|
| requirements 更新有無 | なし（既存Specを使用） |
| design Refine 実施有無 | なし |
| tasks Update 実施有無 | なし |
| 完了タスク再判定有無 | なし |
| 同期理由 | 初回実装開始 |

### 手戻り記録
| Phase | 手戻り回数 | 原因区分 | 備考 |
|-------|--------:|--------|------|
| Phase 3 | 1 | Canon TDD違反 | Cursorが実装コードも作成。退避→再実装 |
| Phase 9a | 1 | Codex P1指摘 | lastSessionStats上書き・setTimeout競合 |
| Phase 9b | 1 | 補完レビュー P1指摘 | setDataコールバック内のsetter分離 |

### 発見・詰まり
| フェーズ | 内容 | 対処 | 時間 | 再発防止 |
|----------|------|------|-----:|---------|
| セットアップ | v7.8.4a必須ファイル不足（AGENTS.md等） | 新規作成 | 10m | テンプレートリポジトリ化 |
| Phase 3 | Canon TDD違反: Cursorがテスト+実装を両方作成 | 実装ファイル退避→Claude Code再実装 | 15m | Cursorへの指示に「実装コード作成禁止」を明記 |
| Phase 4.6 | Playwright MCPがセッション中に接続不可 | CLI経由でPlaywright E2Eテスト実行 | 10m | セッション開始前にMCP接続確認 |
| Phase 4.6 | @playwright/test未インストール・Chromium未DL | npm install + playwright install chromium | 5m | 初期化チェックリストに追加 |
| Phase 9a | Codex: lastSessionStats即時上書きでAC-3.2違反 | previousSessionStats追加（ref経由） | 10m | commit前後のデータフロー図を設計時に作成 |
| Phase 9a | Codex: setTimeout競合でAC-4.4/CP-4違反 | clearTimeout + bonusTimerRef管理 | 5m | 非同期state更新にはref管理を標準化 |
| Phase 9b | setDataコールバック内のsetter呼び出しアンチパターン | useRef + コールバック外での呼び出しに変更 | 5m | Reactのstate更新ルールをsteering/tech.mdに追記 |

### 良かった点
- 既存Specが充実しており、すぐに実装に入れる状態だった
- Canon TDD違反を早期に検出・是正できた（Phase 3 Exit Criteria #3が機能）
- Codexレビューで実際のバグ2件（P1-2, P1-3）を検出。補完レビューでさらに1件
- /simplifyでResultModalの重複コードを統一し、レビュー負荷を軽減
- 70テストが正確性プロパティ（CP-1〜CP-7）を網羅的にカバー

### 改善候補
- Cursorへの指示テンプレートに「実装コードは作成禁止（テストのみ）」を標準化
- Playwright環境の初期化チェックリスト追加（@playwright/test + ブラウザDL）
- 非同期state更新パターン（setTimeout + useRef）をsteering/tech.mdに追記
- tasks.mdのチェックボックス更新を自動化（またはPhase完了時にリマインド）

---

## 完走後の振り返り

### 総所要時間
| フェーズ | 時間 |
|----------|-----:|
| Phase 0.5: External Dependency Check | 0m（スキップ） |
| Phase 1: Spec作成・同期 | 5m |
| Phase 2: Branch + Spec commit | 5m |
| Phase 2.5: Spec Sync Gate | 3m |
| Phase 3: Test（+Canon TDD違反是正） | 20m |
| Phase 4: Impl | 15m |
| Phase 4.5: /simplify | 10m |
| Phase 4.6: Runtime Verification | 15m |
| Phase 5: pre-commit | 3m |
| Phase 6: PR作成 + CI待ち | 10m |
| Phase 7: 自動レビュー確認 | 5m |
| Phase 9a: Codex + 修正 | 20m |
| Phase 9b: 補完レビュー + 修正 | 15m |
| Phase 10: Merge | 5m |
| **合計** | **約130m** |

### フロー評価

#### Spec同期の評価
| 項目 | 評価 |
|------|------|
| Spec同期は機能したか | はい（requirements/design/tasksが一貫） |
| Spec Sync Gate は機能したか | はい（Phase 3前に同期確認） |
| requirements/design/tasks の乖離はあったか | なし |
| 完了タスク再判定は有効だったか | 不要だった（全タスク未着手） |
| Phase 1 への差し戻しは何回発生したか | 0回 |

#### KPI: 手戻り回数
| Phase | 手戻り合計 | 主な原因 |
|-------|--------:|--------|
| Phase 3（テスト） | 1 | Canon TDD違反（Cursorの役割逸脱） |
| Phase 9a（Codex） | 1 | 実コードバグ2件（setTimeout競合 + lastSessionStats上書き） |
| Phase 9b（補完レビュー） | 1 | Reactアンチパターン（setData内setter） |
| **合計** | **3** | |

#### 機能した点（次バージョンに継続）
1. Canon TDD制約 — Phase 3 Exit Criteria #3（全テストFAIL）で違反を即検出
2. Codexクロスチェック — ユニットテストでは見つからない実行時バグを2件検出
3. 補完レビュー — Reactの状態更新アンチパターンを指摘（Codexが見逃した領域）
4. /simplify — レビュー前にコード品質を改善し、レビュー指摘がP1/P2の本質問題に集中

#### 重すぎた点（簡略化候補）
1. Phase 4.6のPlaywright環境構築 — 事前に初期化しておくべき
2. セットアップファイル作成 — テンプレートリポジトリがあれば不要

#### 形骸化した点（削除候補）
1. なし（初回実施のため判断保留）

#### 不足していた点（追加候補）
1. Cursorへの指示テンプレートの標準化（Canon TDD制約の明示）
2. 非同期state更新のベストプラクティス（steering/tech.md）
3. tasks.mdのチェックボックス更新タイミングの明確化

### 次のアクション
- [x] Task 7-8（useGameLogic拡張・FruitHarvestGame統合）を後続PRで実施 → PR#2
- [ ] steering/tech.mdにReact state更新ルールを追記
- [ ] Cursorへの指示テンプレートを標準化

---

## PR#2: Task 7-8 ゲーミフィケーション統合

### 実施フェーズ
- [x] Phase 1: Spec確認（変更不要）
- [x] Phase 2: featureブランチ作成（feature/gamification-integration）
- [x] Phase 2.5: Spec Sync Gate — PASS
- [x] Phase 3: テスト作成（Cursor）— 10テスト、Canon TDD制約OK
- [x] Canon TDD例外手順: Task 8.2テストバグ修正（Cursor）
- [x] Phase 4: 実装（Claude Code）— 全10テストPASS
- [x] Phase 4.5: /simplify — 未使用state・import削除
- [x] Phase 5: pre-commit — ESLint修正（テストのno-var-requires）
- [x] Phase 6: PR作成 → CI全緑
- [x] Phase 7: 自動レビュー — CodeRabbit pass / Devin pass
- [x] Phase 9a: Codex — P0(timeLeft=0)/P1(ResultModal deps)/P2(badge永続) 修正
- [x] Phase 9a: Codex補完 — P1(ResultModal再計算) 修正
- [x] Phase 9b: 補完レビュー — P1(operationStats deps ref化)/P2(命名・eslint・badge初期化) 修正
- [x] Phase 10: Merge — Squash and merge 完了

### Canon TDD 例外記録
| 項目 | 値 |
|------|-----|
| トリガー種別 | テスト自体のバグ |
| 対象テスト | components/__tests__/FruitHarvestGameGamification.test.tsx Task 8.2 |
| 問題 | マウント直後にResultModal(dialog)を期待するが、ゲーム終了フロー未シミュレートのためopen=falseでnull返却 |
| 影響範囲 | Task 8.2テスト1件のみ |
| 判断者 | Claude Code（Phase 4実装中に発見） |
| requirements.md 変更 | 不要（AC-3.1〜3.4は正確） |
| design.md 変更 | 不要（§7.2は正確） |
| tasks.md 変更 | 不要（Task 8.2は正確） |
| テスト修正 | Cursorがゲーム開始→収穫→タイマー終了フローを追加 |
| tests/変更禁止復帰 | 復帰済み |

### 発見・詰まり
| フェーズ | 内容 | 対処 | 時間 | 再発防止 |
|----------|------|------|-----:|---------|
| Phase 3 | Cursorへの「実装コード作成禁止」明記が奏功 — Canon TDD違反なし | - | 0m | 前回の学びが機能 |
| Phase 4 | successStreakRefが必要（React stateの非同期更新でstreak値が古い） | useRefで同期的にカウント管理 | 10m | 非同期state依存のゲームロジックにはref必須 |
| Phase 4 | Task 8.2テストがゲーム終了フロー未シミュレート | Canon TDD例外手順でCursorがテスト修正 | 10m | 統合テストにはフロー全体のシミュレーションを含める |

---

## PR#3: Task 9 星評価・統計の正確性改善

### 実施フェーズ
- [x] Phase 1: Spec更新（AC-1.1a, AC-5.2a追加、design §7.1a/7.2a/7.3更新）
- [x] Phase 2: featureブランチ作成（feature/star-accuracy）
- [x] Phase 2.5: Spec Sync Gate — PASS
- [x] Phase 3: テスト作成（Cursor）— 6テスト
- [x] Phase 4: 実装（Claude Code）— 全6テストPASS
- [x] Canon TDD例外 x2: mockRecordSuccess戻り値追加、test 9.2bドロップ対象変更
- [x] Phase 5: ビルド成功
- [x] Phase 6: PR作成 → CI全緑
- [x] Phase 7: 自動レビュー — CodeRabbit pass / Devin pass
- [x] Phase 9a: Codex — P1(ドラッグ誤動作)/P1(sessionStats遅れ)/P2(レモン演出) 修正
- [x] Phase 9b: 補完レビュー — P1(タイマー終了パスgetLatestSessionStats統一)/P2(tasks更新・コメント) 修正
- [x] Canon TDD例外: getLatestSessionStatsモック追加
- [x] Phase 10: Merge — Squash and merge 完了

### Canon TDD 例外記録
| # | トリガー | 対象 | 修正内容 |
|---|---------|------|---------|
| 1 | 要件変更（recordSuccess戻り値） | useGameLogicGamification.test.tsx Task 7.3 | mockRecordSuccessがstreak値を返すよう修正 |
| 2 | テスト設計変更 | starAccuracy.test.tsx Task 9.2b | スイカ以外→スイカのドロップ領域外リリースに変更 |
| 3 | 要件変更（getLatestSessionStats追加） | useGameLogicGamification.test.tsx Task 7.2 | モックにgetLatestSessionStats追加 |

### 手戻り記録
| Phase | 手戻り回数 | 原因区分 |
|-------|--------:|--------|
| Phase 4 | 1 | Canon TDD例外（recordSuccess戻り値変更に追従） |
| Phase 9a | 1 | Codex P1 x2（ドラッグ誤動作・sessionStats遅れ） |
| Phase 9b | 1 | 補完P1（getLatestSessionStats統一） + Canon TDD例外 |
| **合計** | **3** | |

### 発見・詰まり
| フェーズ | 内容 | 対処 | 時間 | 再発防止 |
|----------|------|------|-----:|---------|
| Phase 4 | 全フルーツでドラッグ開始→通常クリックがdrop失敗に | スイカのみドラッグに戻し、右クリック失敗パスのみ追加 | 15m | UI操作の副作用を設計段階で検証 |
| Phase 4 | recordSuccess戻り値変更で既存テストのモックが壊れた | Canon TDD例外でCursorがモック修正 | 5m | インターフェース変更時はモック影響を事前確認 |
| Phase 9a | sessionStatsがReact state非同期でcommitSession時に1手遅れ | getLatestSessionStats()をref経由で追加 | 10m | steering/tech.mdにref同期パターンを追記済み |
| Phase 9b | タイマー終了パスと即終了パスでsessionStats取得方法が不統一 | 両パスともgetLatestSessionStats()に統一 | 5m | 複数パスがある場合は取得方法を統一 |

### 良かった点
- Cursorへの「実装コード作成禁止」が定着（PR#2-3ともCanon TDD違反なし）
- Codexが左クリックドラッグの回帰バグを検出（テストでは見つけられなかった）
- 補完レビューがパス間の不整合を検出（Codexが見逃した領域）
- steering/tech.mdにReact state更新ルールを追記し、知見を構造化

---

## PR#4: Issue #42 CrazyGames 提出に向けたアップデート（アーケードモード新設）

### 背景
CrazyGames 4本作戦の3番手。最大の壁は「マウス練習ツールは CrazyGames 的にはゲームではない」こと。
**教育モードを消さず、ゲームモードを足す**方針で、競って遊べる遊び方を追加する。

### 実施フェーズ
- [x] Phase 3: テスト作成（先行）— lib/hooks/components/e2e で計150テスト追加
- [x] Phase 4: 実装 — アーケードモード（60秒・コンボ・フィーバー・段位）
- [x] Phase 4.6: Runtime Verification — 実ブラウザ（Playwright MCP）で1プレイ通し確認
- [x] Phase 5: ビルド成功 / lint 既存warningのみ
- [ ] Phase 6: PR作成 → CI
- [ ] Phase 7以降: 自動レビュー

### 実装したもの
| 対象 | 内容 |
| --- | --- |
| `types/arcade.ts` | 60秒固定・コンボ倍率のしきい値・段位（Bronze〜Diamond） |
| `lib/arcadeManager.ts` | コンボ倍率／フィーバーゲージ／段位判定の純粋関数 |
| `hooks/useArcadeMode.ts` | コンボ・フィーバー・自己ベストの状態管理（ポーズ中は時間が進まない） |
| `hooks/useGameLogic.ts` | `startGame(mode)` でモード切替。アーケードはステージ・難易度から独立 |
| `components/game/ModeSelector.tsx` | 待機中のプレイエリアをそのまま入口にする |
| `components/game/ArcadeHUD.tsx` | コンボ数・倍率・フィーバーゲージ |
| `components/game/ArcadeResultModal.tsx` | スコア・自己ベスト更新演出・段位・再挑戦 |
| `lib/touchGestures.ts` + `Fruit.tsx` / `GamePlayArea.tsx` | タッチ4操作（長押し＝右クリック相当） |
| `lib/ads/rewardedBoost.ts` | リワード広告の差し込み口（SDK導入前は無効） |
| `docs/crazygames-store-copy.md` | ストア文言の転換（itch は教育路線のまま） |

### 発見・詰まり
| フェーズ | 内容 | 対処 | 再発防止 |
|----------|------|------|---------|
| Phase 4.6 | 初回プレイなのに「じこベストこうしん！」が出ない | 終了処理が `setTimeLeft` の更新関数の中にあり、StrictMode の二重呼び出しで2回実行されていた。`finishGame` として外に出す | 状態更新関数の中に副作用を書かない。StrictMode を有効にした回帰テストを追加 |
| Phase 4.6 | 苦手な操作のフルーツが畑を埋め尽くし手が止まる | アーケードでは「いちばん少ない種類」を補充し、開始時の畑も4種類そろえる | 補充ロジックは畑の状態を見る |
| Phase 4.6 | タッチのタップが2回数えられることがある | 合成マウスイベントの抑止を時間窓だけに頼っていた。`touchend` の既定動作も止める | 時間に依存する抑止は端末負荷ですり抜ける前提で二重化する |
| E2E | フルーツの重なりでタップが成立せず不安定 | `elementFromPoint` で実際に触れる個体を選ぶヘルパーを追加 | ランダム配置の要素は「触れるもの」を選んでから操作する |

### 判断の記録
- アーケードは**難易度設定・ステージの制限時間から独立**させた（記録を比べる遊びのため）。
- 段位は Issue の「Bronze→Silver→Gold」を骨格に、上手い人が数回で頭打ちにならないよう **Platinum / Diamond まで拡張**。
- アーケードのプレイも**累積統計・習熟度・バッジには反映**する（星は0で渡すためステージの星評価は動かない）。
- うごくモードの強制はしない（プレイヤーの設定を尊重）。
