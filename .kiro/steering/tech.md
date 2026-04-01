---
inclusion: always
---

# Tech Steering

## 言語・ランタイム
- TypeScript (strict mode)
- Node.js / Next.js (App Router)
- Electron（デスクトップ版）

## 主要ライブラリ
- React 18+（hooks中心設計）
- Framer Motion（アニメーション）
- Tailwind CSS + shadcn/ui（スタイリング）
- Jest + React Testing Library（テスト）
- Playwright（E2Eテスト）

## コーディング規約
- TypeScript strictモード有効
- すべての型を `types/` ディレクトリで一元管理
- エイリアスパス `@/*` でインポート簡素化
- React.memo と useCallback で不要な再レンダリングを抑制

## アーキテクチャパターン
- カスタムフック中心設計（UIとロジックの完全分離）
- マネージャーパターン（lib/ にピュア関数）
- requestAnimationFrame ゲームループ（setInterval禁止）
- Context APIは必要に応じて使用（現在はpropsとhooksで管理）

## 開発フロー
- Canon TDD（テスト先行、tests/変更禁止）
- Living Spec（Kiro Spec 継続同期）
- v7.5 GitHub PR運用
