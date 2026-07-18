-- WBS 3.2: RLS設定（匿名read／管理者write）
-- 参照: docs/mvp/spec.md §7-2
--
-- 方針: 全テーブルでRLSを有効化し、read（select）のみ anon/authenticated に許可する。
-- write（insert/update/delete）のポリシーは用意しない。管理者はSupabase管理画面
-- （service_roleキー、RLSを自動バイパス）から直接操作するため、匿名/認証ユーザーの
-- 書き込みは常に拒否される。将来の投稿機能追加時はここにポリシーを追加する。

alter table bread_types enable row level security;
alter table flour_brands enable row level security;
alter table recipes enable row level security;
alter table recipe_flour_map enable row level security;
alter table result_tags enable row level security;
alter table recipe_flour_result_tags enable row level security;

create policy "bread_types are publicly readable"
  on bread_types for select
  to anon, authenticated
  using (true);

create policy "flour_brands are publicly readable"
  on flour_brands for select
  to anon, authenticated
  using (true);

create policy "recipes are publicly readable"
  on recipes for select
  to anon, authenticated
  using (true);

create policy "recipe_flour_map is publicly readable"
  on recipe_flour_map for select
  to anon, authenticated
  using (true);

create policy "result_tags are publicly readable"
  on result_tags for select
  to anon, authenticated
  using (true);

create policy "recipe_flour_result_tags is publicly readable"
  on recipe_flour_result_tags for select
  to anon, authenticated
  using (true);
