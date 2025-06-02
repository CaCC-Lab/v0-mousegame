# Technology Stack

## 概要
フルーツハーベストゲーム（Fruit Harvest Game）の技術スタック定義書。
このファイルに記載されたバージョンや技術スタックは、承認なしに変更してはならない。

## フロントエンド

### コアフレームワーク
- **Next.js**: 14.2.8
  - App Router使用
  - Static Export対応（Electron用）
- **React**: 18.x
- **React DOM**: 18.x
- **TypeScript**: 5.x

### UIライブラリ
- **Tailwind CSS**: 3.4.1
  - tailwind-merge: 2.5.2
  - tailwindcss-animate: 1.0.7
- **Radix UI**（アクセシブルなUIコンポーネント）
  - @radix-ui/react-dialog: 1.1.1
  - @radix-ui/react-icons: 1.3.0
  - @radix-ui/react-label: 2.1.0
  - @radix-ui/react-slot: 1.1.0
  - @radix-ui/react-switch: 1.1.0
- **lucide-react**: 0.439.0（アイコン）
- **class-variance-authority**: 0.7.0（コンポーネントバリアント管理）
- **clsx**: 2.1.1（クラス名結合）

### アニメーション
- **Framer Motion**: 11.5.4

## デスクトップアプリケーション
- **Electron**: 36.3.1
- **electron-builder**: 26.0.12

## 開発ツール

### テストフレームワーク
- **Jest**: 29.7.0
  - jest-environment-jsdom: 30.0.0-beta.3
  - @testing-library/jest-dom: 6.6.3
- **React Testing Library**: 16.3.0
  - @testing-library/user-event: 14.6.1
- **Playwright**: 1.40.0（E2Eテスト）
  - axe-playwright: 2.0.0（アクセシビリティテスト）

### 型定義
- **@types/jest**: 29.5.14
- **@types/node**: 20.x
- **@types/react**: 18.x
- **@types/react-dom**: 18.x

### ビルド・開発補助
- **ESLint**: 8.x
  - eslint-config-next: 14.2.8
- **PostCSS**: 8.x
- **concurrently**: 9.1.2（並列コマンド実行）
- **wait-on**: 8.0.3（ポート待機）

## 環境変数
```env
# 現在は環境変数の使用なし
# 必要に応じて.env.localファイルを作成
```

## APIエンドポイント
- 現在、外部APIの使用はなし
- すべてのゲームロジックはクライアントサイドで完結

## ブラウザサポート
- Chrome/Edge: 最新版
- Firefox: 最新版
- Safari: 最新版
- Electron内蔵Chromium: v128

## Node.jsバージョン
- 推奨: 18.x以上
- 最小要件: 16.x

## パッケージマネージャー
- npm（package-lock.json使用）

## ビルド設定

### Next.js設定
- App Router使用
- Static Export有効（Electron用）
- TypeScript strict mode有効

### Electron設定
- appId: `com.fruitharvestgame.app`
- productName: `Fruit Harvest Game`
- ビルド対象:
  - Windows: NSIS
  - macOS: DMG
  - Linux: AppImage

## 重要な制約事項
1. **バージョン固定**: 記載されたバージョンは承認なしに変更禁止
2. **新規依存関係**: 追加前に必ず承認を得ること
3. **Breaking Changes**: メジャーバージョンアップは影響調査必須
4. **セキュリティ**: 脆弱性が発見された場合のみ、承認を得てアップデート可能