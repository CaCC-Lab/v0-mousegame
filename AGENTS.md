# AGENTS.md

## Overview

このリポジトリはCanon TDD（テスト先行）で開発しています。
tests/ は Cursor が作成し、実装は Claude Code が担当します。
Kiro Spec は Living Spec として継続的に同期します。

## MCP運用ポリシー

### Phase 0.5
- Context7 で主要依存の事実確認を行う
- breaking change / 非推奨 / 実装前提の差分を記録する

### Phase 4.6
- Playwright MCP で主要UIまたは実行フローを確認する
- 実行確認で仕様差分が見つかった場合は Phase 1 に戻る

### Bugfix Step 0
- Current Behavior は証拠に基づいて書く
- Sentry / Playwright / ローカルログなどを証拠ソースとして扱う
- 原因仮説と観測事実を分離する

## Review guidelines

### 要件トレーサビリティ（P0）
- .kiro/specs/*/requirements.md の各要件（US-xxx / AC-xxx）に対応する実装があるか確認
- 未実装の要件があればP0として報告
- 要件IDを明示して報告すること

### 仕様ズレ（P0）
- 実装が requirements.md の記述と矛盾していればP0として報告
- Acceptance Criteria との整合性を確認

### Spec同期（P0）
- requirements/design/tasks の同期状態を確認
- requirements が更新されているのに design/tasks が古い場合はP0として報告

### Canon TDD制約（P0）
- tests/ディレクトリの変更は要注意フラグ
- 実装PRでtests/を変更していたらP0として報告
- 理由: テストはCursorの責務、実装はClaude Codeの責務

### エッジケース（P1）
- 空リスト、空文字列、null/undefined、ゼロ除算の考慮漏れ
- 境界値（off-by-one）エラー

### 型安全性（P2）
- 型ヒントの欠落
- 型の不一致（any型の多用）

## Coding guidelines

- TypeScript strict mode
- React hooks中心設計
- Tailwind CSS + shadcn/ui
- requestAnimationFrame ゲームループ

## Project structure

```
app/            # Next.js App Router
components/     # UIコンポーネント（game/, ui/, __tests__/）
hooks/          # カスタムフック（__tests__/）
lib/            # ビジネスロジック（__tests__/）
types/          # TypeScript型定義
electron/       # Electronメインプロセス
e2e/            # Playwrightテスト
.kiro/specs/    # 仕様書（Kiro生成・同期）
.kiro/steering/ # 基盤Steering
```
