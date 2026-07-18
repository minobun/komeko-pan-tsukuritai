# コーディング規約

## 開発フロー：仕様 → テスト → 実装（テストファースト）

このリポジトリでは、機能追加・変更は次の順で進める。

1. **仕様を確認する** — `docs/mvp/spec.md` や該当issueで「何をどう振る舞わせたいか」を先に固める。仕様が曖昧なら実装前にissueで明確化する。
2. **テストを書く** — 期待する振る舞いをユニットテストとして先に書き、失敗することを確認する。
3. **実装する** — テストが通る最小限の実装を行い、リファクタリングする。

バグ修正も同様に、まず再現するテストを書いてから直す。

## テスト

- テストランナーは [Vitest](https://vitest.dev/)（Next.js公式ガイド
  `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md` に準拠）。
- 実行方法:
  - `npm test` — 全テストを1回実行（CIと同じ）
  - `npm run test:watch` — ウォッチモード
- テストファイルは対象モジュールの近くに `__tests__/<対象名>.test.ts` として置く
  （例: `src/lib/__tests__/filters.test.ts`）。
- PRごとにGitHub Actions（`.github/workflows/test.yml`）でテストが自動実行され、
  失敗するとマージできない。

## テストしやすい設計

- 判定・変換などのロジックはUIコンポーネントに直接書かず、`src/lib/` の純粋関数に
  切り出す（例: 一覧の絞り込みは `src/lib/filters.ts`）。
- コンポーネント側にはURLクエリ同期・描画などUI都合だけを残す。
- 外部依存（Supabase等）はモジュール境界（`src/lib/supabase.ts`）でモックする。
  `async` Server Componentのユニットテストは現状Vitest非対応のため、ロジックを
  切り出してテストする。

## 既存の規約

- データ取得はページから直接書かず `src/lib/data.ts` に集約する（spec.md §7-3）。
- 取得失敗時はフォールバック値を返し、サイト表示を止めない（spec.md §6）。
- Next.jsのAPIはトレーニングデータと異なる場合があるため、実装前に
  `node_modules/next/dist/docs/` の該当ガイドを確認する（AGENTS.md参照）。
