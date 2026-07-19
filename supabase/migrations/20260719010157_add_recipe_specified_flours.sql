-- Issue #94: レシピ記載の米粉を recipe_flour_map から分離する
-- 参照: docs/mvp/spec.md §4.4 / §4.5
--
-- #59 の link_status は性質の異なる2つの事実を1カラムに混ぜていた。
--   1. レシピ側の客観的事実（そのレシピがどの銘柄を使っているか）
--      … brand_specified / visually_identified
--   2. サイト独自の実績（この米粉でこのレシピを作った）
--      … brand_unspecified
-- (recipe_id, flour_brand_id) が unique なため両方を同時に持てず、実食実績が
-- 「銘柄指定あり」に吸収されて見えなくなる。1をレシピ側の事実として本テーブルに
-- 分離し、recipe_flour_map は根拠を問わない自由な紐付けに戻す。

create table recipe_specified_flours (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  flour_brand_id uuid not null references flour_brands(id) on delete cascade,
  -- text   … レシピ本文に銘柄指定が明記されている
  -- visual … レシピの写真・動画等から銘柄が目視で確認できる
  source text not null check (source in ('text', 'visual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recipe_id, flour_brand_id)
);

create index recipe_specified_flours_flour_brand_id_idx
  on recipe_specified_flours(flour_brand_id);

create trigger set_recipe_specified_flours_updated_at
  before update on recipe_specified_flours
  for each row execute function set_updated_at();

-- RLS: 既存テーブルと同方針。読み取りのみ公開し、writeポリシーは用意しない
-- （運営者はservice_role経由で入力する）。
alter table recipe_specified_flours enable row level security;

create policy "recipe_specified_flours is publicly readable"
  on recipe_specified_flours for select
  to anon, authenticated
  using (true);

-- 既存データの移行方針:
--   brand_specified     → source = 'text'（本文に銘柄指定という根拠がそのまま対応する）
--   visually_identified → source = 'visual'（同上）
--   brand_unspecified   → 行を作らない。「recipe_specified_flours に対応行がない紐付け」
--                         として表現できるため、情報は失われない。
-- いずれの場合も recipe_flour_map の行自体は残す（紐付けとしては有効なため）。
-- link_status カラムの削除はUI切り替え後の別PRで行う（#94 の分割3）。
insert into recipe_specified_flours (recipe_id, flour_brand_id, source)
select recipe_id, flour_brand_id,
  case link_status
    when 'brand_specified' then 'text'
    when 'visually_identified' then 'visual'
  end
from recipe_flour_map
where link_status in ('brand_specified', 'visually_identified');
