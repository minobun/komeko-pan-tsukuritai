# Supabase

## マイグレーション適用

```
npx supabase link --project-ref <project-ref>
npx supabase db push
```

`<project-ref>` は `.env.local` の `NEXT_PUBLIC_SUPABASE_URL`（`https://<project-ref>.supabase.co`）から確認できる。

## データ入力手段（WBS 3.4）

初期データは銘柄10〜15件・レシピ30〜40件程度と少量のため、Supabase管理画面（Table Editor）からの直接入力を採用する。CSVインポートスクリプトは、データ件数が大きく増えた場合に改めて検討する。

1. Supabaseダッシュボード → Table Editor で対象テーブルを開く
2. `bread_types` / `result_tags` はマイグレーションで投入済み（追加が必要な場合のみ手入力）
3. `flour_brands` → `recipes` → `recipe_flour_map` の順に手入力する（外部キー依存のため）
