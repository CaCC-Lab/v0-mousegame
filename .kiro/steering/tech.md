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

## React state更新ルール

### ref同期パターン
- ゲームループやイベントハンドラ内で**同一レンダリングサイクル中に最新値が必要**な場合、`useState`の値ではなく`useRef`のミラーを参照する
- 例: `sessionStatsRef`/`streakRef`（useOperationStats）、`scoreRef`/`harvestedFruitsRef`（useGameLogic）
- `setState`のコールバック内から**別のsetter**を呼ばない（バッチ更新の順序が不定になる）。代わりにrefを使って外側で呼ぶ

### setTimeout(fn, 0)の使用
- 意図: 複数のstate更新を別バッチに分離し、UI更新の順序を保証する場合に限定
- 使用時は**必ずコメントで意図を明記**する
- `clearTimeout`で保留タイマーを管理し、failure/reset時に打ち消すこと

### useCallbackの依存配列
- フックが返すオブジェクトリテラル（毎レンダーで新規生成）をdepsに含めない
- 個別のcallback（useCallbackで安定参照）またはref経由でアクセスする

## 開発フロー
- Canon TDD（テスト先行、tests/変更禁止）
- Living Spec（Kiro Spec 継続同期）
- v7.5 GitHub PR運用
