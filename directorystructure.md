# Directory Structure

## 概要
フルーツハーベストゲームのディレクトリ構造と配置ルール。
新規ファイル作成時は必ずこの構造に従うこと。

## ルートディレクトリ構造
```
v0-mousegame/
├── app/                    # Next.js App Router
├── components/             # Reactコンポーネント
├── hooks/                  # カスタムReactフック
├── lib/                    # ビジネスロジック・ユーティリティ
├── types/                  # TypeScript型定義
├── public/                 # 静的アセット
├── electron/               # Electronメインプロセス
├── e2e/                    # E2Eテスト（Playwright）
├── __tests__/              # 統合テスト
├── out/                    # Next.js静的ビルド出力
└── dist/                   # Electronビルド出力
```

## 詳細なディレクトリ構造

### `/app` - Next.js App Router
```
app/
├── favicon.ico             # ファビコン
├── globals.css             # グローバルCSS（Tailwind imports）
├── layout.tsx              # ルートレイアウト
├── page.tsx                # ホームページ（ゲームのエントリーポイント）
└── fonts/                  # Webフォント
    ├── GeistMonoVF.woff
    └── GeistVF.woff
```

### `/components` - UIコンポーネント
```
components/
├── DifficultySelector.tsx  # 難易度選択UI
├── Fruit.tsx               # フルーツコンポーネント
├── FruitHarvestGame.tsx    # メインゲームコンポーネント
├── Particle.tsx            # パーティクルエフェクト単体
├── ParticleContainer.tsx   # パーティクルコンテナ
├── PowerUp.tsx             # パワーアップアイテム
├── SoundControls.tsx       # サウンド制御UI
├── StageSelector.tsx       # ステージ選択UI
├── __tests__/              # コンポーネントテスト
│   └── [ComponentName].test.tsx
└── ui/                     # 基本UIコンポーネント（shadcn/ui）
    ├── button.tsx
    ├── dialog.tsx
    ├── label.tsx
    └── switch.tsx
```

### `/hooks` - カスタムフック
```
hooks/
├── useAnimation.ts         # アニメーション制御
├── useDarkMode.ts          # ダークモード状態管理
├── useDifficulty.ts        # 難易度管理
├── useGameLogic.ts         # ゲームコアロジック
├── useKeyboardControls.ts  # キーボード入力制御
├── useLanguage.ts          # 多言語切り替え
├── useLocalStorage.ts      # LocalStorage永続化
├── usePowerUps.ts          # パワーアップシステム
├── useSoundEffects.ts      # サウンドエフェクト制御
├── useStage.ts             # ステージ管理
├── useTouchEvents.ts       # タッチイベント制御
└── __tests__/              # フックテスト
    └── [hookName].test.tsx
```

### `/lib` - ビジネスロジック
```
lib/
├── animationManager.ts     # アニメーション管理クラス
├── difficultyManager.ts    # 難易度設定管理
├── gameLogic.ts            # ゲームロジック関数群
├── powerUpManager.ts       # パワーアップ管理
├── soundManager.ts         # サウンド管理
├── stageManager.ts         # ステージ進行管理
├── utils.ts                # 汎用ユーティリティ関数
├── i18n/                   # 国際化
│   └── translations.ts     # 翻訳定義
└── __tests__/              # ロジックテスト
    └── [fileName].test.ts
```

### `/types` - 型定義
```
types/
├── animation.ts            # アニメーション関連の型
├── difficulty.ts           # 難易度関連の型
├── game.ts                 # ゲーム全般の型
├── powerup.ts              # パワーアップ関連の型
└── stage.ts                # ステージ関連の型
```

### `/public` - 静的アセット
```
public/
└── sounds/                 # サウンドファイル
    └── README.md           # サウンドファイル配置説明
```

### `/electron` - Electronファイル
```
electron/
├── main.js                 # メインプロセス
└── preload.js              # プリロードスクリプト
```

### `/e2e` - E2Eテスト
```
e2e/
├── accessibility.spec.ts   # アクセシビリティテスト
├── dark-mode-i18n.spec.ts  # ダークモード・多言語テスト
├── electron-app.spec.ts    # Electronアプリテスト
├── game-flow.spec.ts       # ゲームフローテスト
├── mobile-responsive.spec.ts # レスポンシブテスト
├── performance.spec.ts     # パフォーマンステスト
├── test-all.spec.ts        # 統合テストスイート
└── helpers/                # テストヘルパー
    └── test-utils.ts
```

### `/__tests__` - 統合テスト
```
__tests__/
├── dark-mode.test.tsx      # ダークモード統合テスト
├── documentation.test.js   # ドキュメント検証
├── electron-app.test.js    # Electronアプリ統合テスト
├── electron-build.test.js  # ビルドプロセステスト
├── electron-window.test.js # ウィンドウ管理テスト
├── highscore-persistence.test.tsx # スコア永続化テスト
└── i18n.test.tsx           # 多言語統合テスト
```

## ファイル命名規則

### コンポーネント
- **ファイル名**: PascalCase（例: `FruitHarvestGame.tsx`）
- **テストファイル**: `[ComponentName].test.tsx`

### フック
- **ファイル名**: camelCase、`use`プレフィックス（例: `useGameLogic.ts`）
- **テストファイル**: `[hookName].test.tsx`

### ロジック・ユーティリティ
- **ファイル名**: camelCase（例: `gameLogic.ts`）
- **テストファイル**: `[fileName].test.ts`

### 型定義
- **ファイル名**: camelCase（例: `game.ts`）
- **エクスポート**: 各ファイルから関連する型をまとめてエクスポート

## 新規ファイル作成時のルール

1. **配置場所の確認**
   - UI要素 → `/components`
   - 状態管理・副作用 → `/hooks`
   - ピュアな関数・ロジック → `/lib`
   - 型定義 → `/types`

2. **テストファイルの同時作成**
   - 各ディレクトリの`__tests__`フォルダに配置
   - TDD原則に従い、実装前にテストを作成

3. **命名規則の遵守**
   - 上記の命名規則を厳守
   - 一貫性のある命名を心がける

4. **責任の分離**
   - 1ファイル1責任の原則
   - 大きなファイルは適切に分割

5. **インポート順序**
   ```typescript
   // 1. 外部ライブラリ
   import React from 'react';
   import { motion } from 'framer-motion';
   
   // 2. 内部モジュール（絶対パス）
   import { Button } from '@/components/ui/button';
   
   // 3. 相対パス
   import { GameState } from '../types/game';
   
   // 4. スタイル
   import './styles.css';
   ```

## 禁止事項

1. **ルート直下への配置禁止**
   - 設定ファイル以外はルート直下に配置しない

2. **ネストの深さ制限**
   - ディレクトリは3階層まで（特別な理由がない限り）

3. **重複コンポーネント禁止**
   - 同じ機能のコンポーネントを複数作成しない
   - 既存コンポーネントの確認を徹底

4. **不適切な配置禁止**
   - ロジックを`/components`に配置しない
   - UIコンポーネントを`/lib`に配置しない