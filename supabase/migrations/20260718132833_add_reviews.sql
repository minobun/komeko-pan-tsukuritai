-- Issue #57: 感想（レビュー）テーブルの新設
-- 参照: docs/mvp/spec.md §4.6
--
-- recipe_flour_map（レシピ×米粉の紐付け）1件に対して感想を複数件蓄積する。
-- 当面の入力者は運営者のみだが、将来の一般ユーザー投稿（#52）を見据えて
-- 投稿者情報（表示名・種別）を持たせる。

create table reviews (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references recipe_flour_map(id) on delete cascade,
  body text not null,
  flour_tips text,
  author_name text not null default '運営者',
  author_type text not null default 'operator' check (author_type in ('operator', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reviews_map_id_idx on reviews(map_id);

create trigger set_reviews_updated_at
  before update on reviews
  for each row execute function set_updated_at();

-- RLS: 現行方針どおり読み取りのみ公開。writeポリシーは用意せず、
-- 運営者はSupabase管理画面（service_role、RLS自動バイパス）から入力する。
alter table reviews enable row level security;

create policy "reviews are publicly readable"
  on reviews for select
  to anon, authenticated
  using (true);

-- 既存 recipe_flour_map.result_memo を感想として移行する。
-- result_memo カラム自体はUIが感想表示へ切り替わるまで残す（削除は別PR）。
insert into reviews (map_id, body)
select id, result_memo
from recipe_flour_map
where result_memo is not null and result_memo <> '';
