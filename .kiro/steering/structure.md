---
inclusion: always
---

# Structure Steering

## ディレクトリ構成

```
app/                # Next.js App Router（ページとレイアウト）
components/         # UIコンポーネント
  ├── game/        # ゲーム専用コンポーネント
  ├── ui/          # shadcn/ui再利用可能コンポーネント
  └── __tests__/   # コンポーネントのユニットテスト
hooks/             # カスタムフック（ロジックとUIの分離）
  └── __tests__/   # フックのユニットテスト
lib/               # ビジネスロジック（ピュア関数とマネージャー）
  ├── i18n/        # 多言語対応
  └── __tests__/   # ロジックのユニットテスト
types/             # TypeScript型定義
electron/          # Electronメインプロセスとプリロード
e2e/               # Playwrightエンドツーエンドテスト
.kiro/specs/       # Feature Spec / Bugfix Spec
.kiro/steering/    # 基盤Steering
```

## ファイル命名規則
- コンポーネント: `components/{カテゴリ}/{PascalCase}.tsx`
- フック: `hooks/use{PascalCase}.ts`
- ロジック: `lib/{camelCase}Manager.ts`
- 型定義: `types/{camelCase}.ts`
- テスト: `{対象ディレクトリ}/__tests__/{対象ファイル名}.test.ts(x)`

## モジュール分離方針
- UIコンポーネントはプレゼンテーション層に専念
- ゲームロジックはカスタムフックに集約
- ピュア関数はlib/配下のマネージャーに配置
- 型定義はtypes/で一元管理（分散禁止）
