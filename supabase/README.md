# Supabase

## マイグレーション作成

ファイルは必ず次のコマンドで作成する（ファイル名を手で決めない）。

```
npx supabase migration new <name>
```

先頭のタイムスタンプが適用順（バージョン）になるため、**既存のどのマイグレーションよりも新しい値**でなければならない。
手で命名して既適用より古いバージョンを作ると、

- まっさらなDBでは依存関係より先に流れて失敗する（例: 参照先テーブルがまだ無い）
- 適用済みのDBには out-of-order として適用されない

という状態になる（実例: #79）。

## マイグレーション適用

```
npx supabase link --project-ref <project-ref>
npx supabase db push
```

`<project-ref>` は `.env.local` の `NEXT_PUBLIC_SUPABASE_URL`（`https://<project-ref>.supabase.co`）から確認できる。

適用後は `npm run build` でデータ取得が成功する（`[data] ... failed, falling back` が出ない）ことを確認する。

## データ入力手段（WBS 3.4）

初期データは銘柄10〜15件・レシピ30〜40件程度と少量のため、Supabase管理画面（Table Editor）からの直接入力を採用する。CSVインポートスクリプトは、データ件数が大きく増えた場合に改めて検討する。

1. Supabaseダッシュボード → Table Editor で対象テーブルを開く
2. `bread_types` / `result_tags` はマイグレーションで投入済み（追加が必要な場合のみ手入力）
3. `flour_brands` → `recipes` → `recipe_flour_map` の順に手入力する（外部キー依存のため）
