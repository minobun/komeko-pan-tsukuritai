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

### 既知の警告: `failed to cache migrations catalog`（無害）

`db push` の最後に次のWarningが出ることがあるが、**マイグレーションの適用自体は成功しており実害はない**（#81）。

```
Warning: failed to cache migrations catalog: error exporting pg-delta catalog:
edge-runtime script produced no output: ... Failed to read certificate file
'/workspace/supabase/.temp/pgdelta/pgdelta-target-ca.crt': ENOENT ...
```

- 失敗しているのは適用後の「マイグレーションカタログのキャッシュ」処理のみ。これは
  pg-delta（宣言的スキーマ管理・allpha版）の `db diff` 高速化用キャッシュで、
  本リポジトリの運用（通常のマイグレーションファイル + `db push`）では使われない。
- 原因はCLI側: ホストで生成した証明書（`supabase/.temp/pgdelta/`）が、pg-deltaを実行する
  edge-runtimeコンテナ内のパスから見えていない（CLI 2.109.1 + pg-delta 1.0.0-alpha.27）。
- 対応不要。`Finished supabase db push.` が出ていれば成功。気になる場合はCLIを更新して再確認する。

## データ入力手段（WBS 3.4）

初期データは銘柄10〜15件・レシピ30〜40件程度と少量のため、Supabase管理画面（Table Editor）からの直接入力を採用する。CSVインポートスクリプトは、データ件数が大きく増えた場合に改めて検討する。

1. Supabaseダッシュボード → Table Editor で対象テーブルを開く
2. `bread_types` / `result_tags` はマイグレーションで投入済み（追加が必要な場合のみ手入力）
3. `flour_brands` → `recipes` → `recipe_flour_map` の順に手入力する（外部キー依存のため）
