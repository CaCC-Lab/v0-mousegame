# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## フルーツハーベストゲーム (Fruit Harvest Game)

小学生向けのマウス操作学習ツール。Next.js + TypeScript + Electronでブラウザとデスクトップの両方に対応。

## Core Commands

### Development
```bash
# Next.js開発サーバー起動（ポート3000）
npm run dev

# Electron開発モード（Next.jsサーバーと連携）
npm run electron:dev
```

### Testing
```bash
# ユニットテスト実行（Jest）
npm test

# ウォッチモードでテスト（開発時推奨）
npm run test:watch

# カバレッジレポート生成
npm run test:coverage

# E2Eテスト実行（Playwright、全ブラウザ）
npm run test:e2e

# E2EテストUIモード（デバッグ用）
npm run test:e2e:ui

# E2Eテストデバッグモード
npm run test:e2e:debug
```

### Build & Deploy
```bash
# Next.jsビルド（静的エクスポート）
npm run build

# Electronビルド（プラットフォーム別）
npm run build:win     # Windows (.exe + installer)
npm run build:mac     # macOS (.dmg)
npm run build:linux   # Linux (.AppImage)

# Electronビルド（配布なし）
npm run dist
```

### Code Quality
```bash
# ESLintでコード品質チェック
npm run lint
```

## Architecture Overview

### ディレクトリ構造
```
app/                # Next.js App Router（ページとレイアウト）
components/         # UIコンポーネント（Fruit、PowerUp、ParticleContainer等）
  ├── ui/          # shadcn/ui再利用可能コンポーネント
  └── __tests__/   # コンポーネントのユニットテスト
hooks/             # カスタムフック（ロジックとUIの分離）
  ├── useGameLogic.ts      # ゲームコア状態管理（スコア、フルーツ、タイマー）
  ├── usePowerUps.ts       # パワーアップシステム
  ├── useStage.ts          # ステージ進行管理
  ├── useSoundEffects.ts   # サウンド制御
  ├── useAnimation.ts      # アニメーション管理
  ├── useDifficulty.ts     # 難易度調整
  ├── useLocalStorage.ts   # 永続化
  └── __tests__/           # フックのユニットテスト
lib/               # ビジネスロジック（ピュア関数とマネージャー）
  ├── gameLogic.ts         # ゲーム計算ロジック
  ├── stageManager.ts      # ステージ管理
  ├── soundManager.ts      # サウンド管理
  ├── powerUpManager.ts    # パワーアップ管理
  ├── difficultyManager.ts # 難易度管理
  ├── animationManager.ts  # アニメーション管理
  ├── i18n/               # 多言語対応
  └── __tests__/          # ロジックのユニットテスト
types/             # TypeScript型定義
  ├── game.ts      # ゲーム基本型（Fruit、GameState等）
  ├── stage.ts     # ステージ関連型
  ├── powerup.ts   # パワーアップ型
  ├── difficulty.ts # 難易度型
  └── animation.ts # アニメーション型
electron/          # Electronメインプロセスとプリロード
e2e/              # Playwrightエンドツーエンドテスト
```

### アーキテクチャパターン

**1. カスタムフック中心設計**
- ゲームロジックをカスタムフックに集約し、UIコンポーネントと完全分離
- 各フックはrefを使ってrequestAnimationFrameループを管理
- `useGameLogic`が主要フック群を統合（useSoundEffects、usePowerUps、useStage等）

**2. マネージャーパターン（lib/）**
- 各機能を独立したマネージャーファイルで管理（単一責任の原則）
- ピュア関数による予測可能な動作とテスタビリティ向上
- フックから呼び出されるビジネスロジック層

**3. フルーツ収穫メカニズム**（教育目的）
- 🍎 リンゴ: クリック（最も基本的な操作）
- 🫐 ブルーベリー: ダブルクリック（タイミング練習）
- 🍋 レモン: 右クリック（副ボタン）
- 🍉 スイカ: ドラッグ＆ドロップ（複合操作）

**4. requestAnimationFrameゲームループ**
- setIntervalではなくrequestAnimationFrameで60fps実現
- useRefでアニメーションフレームIDとタイムスタンプを管理
- `useGameLogic`内でゲーム状態を毎フレーム更新

## Test Strategy

**TDD（テスト駆動開発）を厳守**
- 新機能実装前に必ずテストを作成（Test → Implement → Refactor）
- テストファイルの配置:
  - コンポーネントテスト: `components/__tests__/`（Jest + React Testing Library）
  - フックテスト: `hooks/__tests__/`（@testing-library/react-hooks）
  - ロジックテスト: `lib/__tests__/`（Jest、ピュア関数のテスト）
  - E2Eテスト: `e2e/`（Playwright、複数ブラウザ対応）
- モックの使用を避け、実際の実装をテスト（より実践的なテストを実現）
- カバレッジ目標: 90%以上（現在92%達成）

## Key Features

1. **多言語対応**: `lib/i18n/translations.ts`で日本語・英語切り替え、`useLanguage`フックで言語管理
2. **永続化**: `useLocalStorage`フックでハイスコア・設定をLocalStorageに保存
3. **パワーアップシステム**: 5種類のパワーアップ（SpeedBoost、ScoreMultiplier、SlowMotion、Magnet、Shield）
4. **ステージ制**: 6ステージ、各ステージで難易度とフルーツ出現率が変化
5. **難易度調整**: ノーマル/ハードモードの切り替え
6. **パーティクルエフェクト**: Framer Motionによる視覚的フィードバック
7. **サウンドエフェクト**: 収穫時の効果音とBGM（設定で制御可能）
8. **キーボード対応**: `useKeyboardControls`でキーボード操作をサポート
9. **マウス専用**: タッチのみの端末には`TouchDeviceNotice`が「マウスのあるパソコンで開いてね」と案内（マウス練習ツールのため）

## Development Patterns

**状態管理**
- React hooksベース、Context APIは必要に応じて使用（現在はpropsとhooksで管理）
- Reduxなどの外部状態管理ライブラリは不使用
- `useRef`で可変値を管理（アニメーションフレーム、タイムスタンプ等）

**スタイリング**
- Tailwind CSS（ユーティリティファースト）
- shadcn/ui（再利用可能なUIコンポーネント）
- マウスのあるPC向けの固定レイアウト（プレイエリアが画面の主役）

**アニメーション**
- Framer Motion（宣言的アニメーション）
- requestAnimationFrame（ゲームループの最適化）
- React.memoとuseCallbackで不要な再レンダリングを抑制

**型安全性**
- TypeScript strictモード有効
- すべての型を`types/`ディレクトリで一元管理
- エイリアスパス`@/*`でインポート簡素化

**コンポーネント設計**
- 機能単位で分割、単一責任の原則を遵守
- UIとロジックを分離（カスタムフックパターン）
- コンポーネントはプレゼンテーション層に専念

## Important Notes

- **TDD厳守**: テストなしでの実装は禁止
- **実装優先**: モックの多用を避け、実際の実装をテスト
- **パフォーマンス**: 60fps維持が必須（requestAnimationFrameループ）
- **教育目的**: 小学生が使うため、操作判定は少し緩めに設計
- **アクセシビリティ**: キーボード操作とARIA属性を適切に設定