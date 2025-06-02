# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## フルーツハーベストゲーム (Fruit Harvest Game)

落下するフルーツをキャッチして高得点を目指すアクションゲーム。Next.js + TypeScript + Electronでブラウザとデスクトップの両方に対応。

## Core Commands

### Development
```bash
# Next.js開発サーバー起動
npm run dev

# Electron開発モード
npm run electron:dev
```

### Testing
```bash
# ユニットテスト実行
npm test

# ウォッチモードでテスト
npm run test:watch

# カバレッジレポート生成
npm run test:coverage

# E2Eテスト実行
npm run test:e2e

# E2EテストUIモード（デバッグ用）
npm run test:e2e:ui
```

### Build & Deploy
```bash
# Next.jsビルド
npm run build

# Electronビルド（プラットフォーム別）
npm run build:win     # Windows
npm run build:mac     # macOS
npm run build:linux   # Linux
```

### Code Quality
```bash
# ESLintでコード品質チェック
npm run lint
```

## Architecture Overview

### ディレクトリ構造の責務
- `components/`: UIコンポーネント（Fruit、PowerUp、ParticleContainer等）とそのテスト
- `hooks/`: カスタムフック（ゲームロジック、アニメーション、状態管理）
- `lib/`: ビジネスロジックとマネージャークラス（gameLogic、stageManager、soundManager等）
- `types/`: TypeScript型定義（game、stage、powerup等）
- `electron/`: Electronメインプロセスとプリロード

### 主要なアーキテクチャパターン

1. **カスタムフック中心設計**
   - `useGameLogic`: ゲームのコア状態管理
   - `usePowerUps`: パワーアップシステム
   - `useStage`: ステージ進行管理
   - `useSoundEffects`: サウンド制御

2. **マネージャーパターン**（lib/配下）
   - 各機能ごとに独立したマネージャークラス
   - ピュア関数による予測可能な動作

3. **フルーツ収穫メカニズム**
   - リンゴ: クリック
   - ブルーベリー: ダブルクリック
   - レモン: 右クリック
   - スイカ: ドラッグ＆ドロップ

## Test Strategy

**TDD（テスト駆動開発）を厳守**：
- 新機能実装前に必ずテストを作成
- コンポーネントテスト: `components/__tests__/`
- フックテスト: `hooks/__tests__/`
- ロジックテスト: `lib/__tests__/`
- E2Eテスト: `e2e/`

## Key Features & Implementation Notes

1. **多言語対応**: `lib/i18n/translations.ts`で日本語・英語切り替え
2. **ダークモード**: `useDarkMode`フックとTailwind CSSのdarkクラス
3. **永続化**: LocalStorageでハイスコア・設定を保存
4. **パワーアップ**: 5種類（SpeedBoost、ScoreMultiplier、SlowMotion、Magnet、Shield）
5. **ステージ制**: 6ステージ、各ステージで難易度上昇
6. **パーティクルエフェクト**: Framer Motionによる視覚効果

## Development Patterns

- **状態管理**: React hooksとContext APIを使用（Reduxなし）
- **スタイリング**: Tailwind CSS + shadcn/ui
- **アニメーション**: Framer Motion（requestAnimationFrameでの最適化）
- **型安全性**: TypeScript strictモード有効
- **コンポーネント**: 機能単位で分割、単一責任の原則を遵守

## Important Notes

- テストなしでの実装は禁止（TDD必須）
- モックの使用は避け、実際の実装をテスト
- パフォーマンス重視（60fps維持）
- アクセシビリティ対応（キーボード操作、ARIA属性）