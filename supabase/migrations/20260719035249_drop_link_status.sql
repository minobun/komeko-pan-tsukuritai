-- Issue #94 の後片付け: recipe_flour_map.link_status を削除する
-- 参照: docs/mvp/spec.md §4.4
--
-- 分割1（20260719010157_add_recipe_specified_flours.sql）でレシピ側の事実を
-- recipe_specified_flours へ移行し、分割2（PR #98）でアプリからの参照を無くした。
-- 本マイグレーションでカラム自体を落とす。
--
-- 移行済みの対応:
--   brand_specified     → recipe_specified_flours.source = 'text'
--   visually_identified → recipe_specified_flours.source = 'visual'
--   brand_unspecified   → 対応行なし（recipe_flour_map の行だけが残る）
--
-- 実行順の注意: 本番デプロイでアプリが link_status を select しなくなってから適用する。
-- 先に落とすと該当クエリが失敗し、[data] ... failed, falling back が出る。

alter table recipe_flour_map
  drop constraint if exists recipe_flour_map_link_status_check;

alter table recipe_flour_map
  drop column if exists link_status;
