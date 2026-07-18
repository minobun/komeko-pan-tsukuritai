-- issue #60: メーカー（製造会社）をマスタテーブルに正規化する
-- 参照: docs/mvp/spec.md §4.7
--
-- flour_brands.maker_name（文字列直接入力）は表記ゆれを防げず、会社単位での
-- 集計・表示もできないため、makers マスタを新設してFK参照に置き換える。

-- 4.7 makers（メーカーマスタ）
create table makers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  official_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_makers_updated_at
  before update on makers
  for each row execute function set_updated_at();

-- 既存データの移行: maker_name の重複を除いてマスタを生成し、参照を張り替える。
-- 前後の空白だけが異なる表記は同一メーカーとして寄せる。
insert into makers (name)
select distinct btrim(maker_name)
from flour_brands
on conflict (name) do nothing;

alter table flour_brands add column maker_id uuid references makers(id);

update flour_brands b
set maker_id = m.id
from makers m
where m.name = btrim(b.maker_name);

alter table flour_brands alter column maker_id set not null;
alter table flour_brands drop column maker_name;

create index flour_brands_maker_id_idx on flour_brands(maker_id);

-- RLS: 他のマスタと同じく匿名readのみ許可する
-- （方針は 20260718164458_rls_policies.sql 参照）
alter table makers enable row level security;

create policy "makers are publicly readable"
  on makers for select
  to anon, authenticated
  using (true);
