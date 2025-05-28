# フルーツハーベストゲーム (Fruit Harvest Game)

## 概要

フルーツハーベストゲームは、落ちてくるフルーツをキャッチして高得点を目指す楽しいアクションゲームです。Next.jsとElectronで構築され、ブラウザとデスクトップアプリの両方で楽しむことができます。

## 特徴

- 🎮 直感的なキーボード操作
- 🍎 様々な種類のフルーツ（リンゴ、バナナ、チェリー、ブドウ、オレンジ）
- 🏆 ハイスコア記録機能
- 🖥️ デスクトップアプリとして実行可能（Electron）
- 📱 レスポンシブデザイン
- 🎯 難易度が徐々に上昇

## インストール

### 必要な環境

- Node.js 18.0以降
- npm または yarn

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/CaCC-Lab/v0-mousegame.git

# ディレクトリに移動
cd v0-mousegame

# 依存関係をインストール
npm install
```

## 実行方法

### ウェブブラウザで実行

```bash
# 開発サーバーを起動
npm run dev

# ブラウザで http://localhost:3000 を開く
```

### デスクトップアプリとして実行

```bash
# Electronアプリを起動
npm run electron:dev
```

### プロダクションビルド

```bash
# ウェブ版をビルド
npm run build

# デスクトップアプリをビルド
npm run build:win   # Windows版
npm run build:mac   # macOS版
npm run build:linux # Linux版
```

## キーボード操作

| キー | 動作 |
|------|------|
| ← / → | 左右に移動 |
| ↑ / ↓ | 上下に移動 |
| スペース | ゲームを開始/一時停止 |
| P | ゲームを一時停止 |
| R | ゲームをリスタート |
| Ctrl+N (Win/Linux) / Cmd+N (Mac) | 新しいゲーム |
| F11 | フルスクリーン切り替え |

### ゲームの遊び方

1. スペースキーを押してゲームを開始
2. 矢印キーでバスケットを操作
3. 落ちてくるフルーツをキャッチ
4. 3つ以上フルーツを逃すとゲームオーバー
5. より多くのフルーツをキャッチして高得点を目指そう！

### スコアシステム

- 🍎 リンゴ: 10点
- 🍌 バナナ: 20点
- 🍒 チェリー: 30点
- 🍇 ブドウ: 40点
- 🍊 オレンジ: 50点

## 開発

### 開発環境のセットアップ

```bash
# 開発サーバーを起動
npm run dev

# テストを実行
npm test

# テストをウォッチモードで実行
npm run test:watch

# カバレッジレポートを生成
npm run test:coverage

# E2Eテストを実行
npm run test:e2e

# E2EテストをUIモードで実行
npm run test:e2e:ui

# E2Eテストをデバッグモードで実行
npm run test:e2e:debug

# リントを実行
npm run lint
```

### プロジェクト構造

```
v0-mousegame/
├── app/                 # Next.js アプリケーションファイル
├── components/          # Reactコンポーネント
├── electron/           # Electronメインプロセス
├── hooks/              # カスタムReactフック
├── lib/                # ユーティリティ関数
├── types/              # TypeScript型定義
└── __tests__/          # テストファイル
```

### 技術スタック

- **フロントエンド**: Next.js 14, React 18, TypeScript
- **スタイリング**: Tailwind CSS
- **デスクトップ**: Electron
- **テスト**: Jest, React Testing Library
- **ビルドツール**: electron-builder

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。