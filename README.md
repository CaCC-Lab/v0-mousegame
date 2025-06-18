# フルーツハーベストゲーム

Next.js、React、TypeScript、Electronで構築されたマルチプラットフォーム対応のアクションゲーム。様々なインタラクション方法を用いて落下するフルーツを収集し、ハイスコアを目指します。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.8-blue)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-32.0-47848F)](https://www.electronjs.org/)

## 特徴

- **クロスプラットフォーム対応**: Webブラウザおよびデスクトップアプリケーション（Windows、macOS、Linux）で動作
- **多様なインタラクション**: クリック、ダブルクリック、右クリック、ドラッグ＆ドロップに対応
- **段階的な難易度**: 6つのステージで徐々に難易度が上昇
- **パワーアップシステム**: 8種類の異なる効果を持つパワーアップ
- **国際化対応**: 日本語と英語の完全サポート
- **テスト駆動開発**: JestとReact Testing Libraryによる包括的なテストカバレッジ
- **レスポンシブデザイン**: 様々な画面サイズとデバイスに最適化
- **パフォーマンス最適化**: 効率的なレンダリングで60fpsのゲームプレイを実現

## 技術スタック

- **フロントエンドフレームワーク**: Next.js 14.2.8 (App Router)
- **UIライブラリ**: React 18 + TypeScript
- **スタイリング**: Tailwind CSS 3.4 + shadcn/ui コンポーネント
- **アニメーション**: Framer Motion
- **デスクトップフレームワーク**: Electron 32.0
- **テスティング**: Jest + React Testing Library + Playwright
- **ビルドツール**: Turbopack、electron-builder
- **状態管理**: React Hooks + Context API

## セットアップ

### 前提条件

- Node.js 18.0以上
- npm または yarn
- Git

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/CaCC-Lab/v0-mousegame.git

# プロジェクトディレクトリへ移動
cd v0-mousegame

# 依存関係のインストール
npm install
```

### 開発

```bash
# Next.js開発サーバーの起動
npm run dev

# Electron開発モードの起動
npm run electron:dev

# ウォッチモードでのテスト実行
npm run test:watch

# E2Eテストの実行
npm run test:e2e

# コードのリント
npm run lint
```

### プロダクションビルド

```bash
# Next.jsアプリケーションのビルド
npm run build

# Electronアプリケーションのビルド
npm run build:win     # Windows (.exe)
npm run build:mac     # macOS (.dmg)
npm run build:linux   # Linux (.AppImage)
```

## アーキテクチャ

### プロジェクト構造

```
v0-mousegame/
├── app/                    # Next.js App Routerページ
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # ホームページ
│   └── globals.css        # グローバルスタイル
├── components/            # Reactコンポーネント
│   ├── FruitHarvestGame.tsx   # メインゲームコンポーネント
│   ├── Fruit.tsx              # フルーツエンティティ
│   ├── PowerUp.tsx            # パワーアップコンポーネント
│   ├── DifficultySelector.tsx # 難易度選択
│   └── ui/                    # 再利用可能なUIコンポーネント
├── hooks/                 # カスタムReactフック
│   ├── useGameLogic.ts       # ゲームロジックのコア
│   ├── usePowerUps.ts        # パワーアップシステム
│   ├── useStage.ts           # ステージ管理
│   └── useLanguage.ts        # 国際化フック
├── lib/                   # ビジネスロジック
│   ├── gameLogic.ts          # ゲームメカニクス
│   ├── stageManager.ts       # ステージ進行管理
│   ├── soundManager.ts       # オーディオ管理
│   └── i18n/                 # 翻訳ファイル
├── types/                 # TypeScript型定義
│   ├── game.ts              # ゲームエンティティ
│   ├── stage.ts             # ステージ型
│   └── powerup.ts           # パワーアップ型
├── electron/              # Electron固有のコード
│   ├── main.ts              # メインプロセス
│   └── preload.ts           # プリロードスクリプト
└── __tests__/            # テストファイル
```

### 主要な設計パターン

1. **カスタムフックアーキテクチャ**: ゲームロジックを再利用可能でテスタブルなカスタムフックにカプセル化
2. **マネージャーパターン**: ステージ、サウンド、難易度用の専用マネージャークラス
3. **コンポーネント合成**: UIコンポーネントは小さく再利用可能な部品で構成
4. **テスト駆動開発**: すべての機能はテストファーストで開発

### ゲームメカニクス

#### フルーツ収集方法

| フルーツ | インタラクション | ポイント | 実装 |
|---------|-----------------|----------|------|
| りんご | シングルクリック | 10 | 標準クリックイベント |
| ブルーベリー | ダブルクリック | 20 | タイミング付きクリックイベント |
| レモン | 右クリック | 30 | コンテキストメニュー防止 |
| スイカ | ドラッグ＆ドロップ | 50 | マウストラッキング＋ドロップゾーン |

#### パワーアップシステム

10秒ごとにランダムに出現する8種類のパワーアップ：

- **スピードブースト**: フルーツの動きを遅くする（15秒）
- **スコア倍率**: ポイントを2倍にする（20秒）
- **スローモーション**: 時間を凍結（10秒）
- **マグネット**: 近くのフルーツを引き寄せる
- **シールド**: フルーツを逃してもペナルティなし（30秒）
- **時間延長**: 15秒追加
- **追加フルーツ**: 5つの新しいフルーツを生成
- **時間凍結**: タイマーを停止（10秒）

## テスティング

プロジェクトはテスト駆動開発（TDD）の原則に従い、包括的なテストカバレッジを実現：

```bash
# すべてのテストを実行
npm test

# カバレッジ付きでテストを実行
npm run test:coverage

# E2Eテストを実行
npm run test:e2e

# UIモードでE2Eテストを実行
npm run test:e2e:ui
```

### テスト構成

- **ユニットテスト**: コンポーネント、フック、ユーティリティ
- **統合テスト**: ゲームフローと状態管理
- **E2Eテスト**: Playwrightによる完全なユーザーシナリオ

## デプロイメント

### Webデプロイメント

アプリケーションは任意の静的ホスティングサービスにデプロイ可能：

```bash
# プロダクション用ビルド
npm run build

# 出力は .next/ ディレクトリに生成
```

### デスクトップ配布

Electronビルドは自動更新をサポート：

```bash
# すべてのプラットフォーム用にビルドとパッケージング
npm run build:all
```

## 設定

### 環境変数

ローカル開発用に `.env.local` ファイルを作成：

```env
# 環境固有の変数をここに追加
```

### ゲーム設定

ゲームパラメータは `types/difficulty.ts` と `types/stage.ts` で調整可能：

- フルーツの出現率
- 移動速度
- 時間制限
- スコア倍率

## コントリビューション

1. リポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: 素晴らしい機能を追加'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### コードスタイル

- 既存のコードスタイルに従う
- TypeScript strictモードを使用
- 新機能にはテストを作成
- 必要に応じてドキュメントを更新

## パフォーマンス考慮事項

- **レンダリング**: React.memoとuseCallbackによる最適化
- **アニメーション**: RequestAnimationFrameで滑らかな60fpsゲームプレイ
- **状態管理**: 適切な依存配列による再レンダリングの最適化
- **アセット読み込み**: オーディオと画像の遅延読み込み

## ブラウザサポート

- Chrome/Edge（最新版）
- Firefox（最新版）
- Safari（最新版）
- Electron（Windows、macOS、Linux）

## ライセンス

このプロジェクトはMITライセンスの下でライセンスされています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 謝辞

- [Next.js](https://nextjs.org/)で構築
- [shadcn/ui](https://ui.shadcn.com/)のUIコンポーネント
- [Lucide](https://lucide.dev/)のアイコン
- [Framer Motion](https://www.framer.com/motion/)によるアニメーション