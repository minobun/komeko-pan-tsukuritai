-- WBS 3.1: テーブル定義（recipes / bread_types / flour_brands / recipe_flour_map / result_tags）
-- 参照: docs/mvp/spec.md §4

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 4.2 bread_types（パン種別マスタ）
create table bread_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_bread_types_updated_at
  before update on bread_types
  for each row execute function set_updated_at();

-- 4.3 flour_brands（米粉銘柄マスタ）
create table flour_brands (
  id uuid primary key default gen_random_uuid(),
  maker_name text not null,
  product_name text not null,
  is_bread_use boolean not null default true,
  has_gluten boolean not null default false,
  has_psyllium boolean not null default false,
  origin text,
  jan_code text,
  official_url text,
  image_url text,
  purchase_url_amazon text,
  purchase_url_rakuten text,
  is_discontinued boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_flour_brands_updated_at
  before update on flour_brands
  for each row execute function set_updated_at();

-- 4.1 recipes（レシピ）
create table recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null unique,
  site_name text not null,
  author_name text not null,
  bread_type_id uuid not null references bread_types(id),
  memo text,
  status text not null default 'published' check (status in ('published', 'link_broken', 'hidden')),
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recipes_bread_type_id_idx on recipes(bread_type_id);
create index recipes_status_idx on recipes(status);

create trigger set_recipes_updated_at
  before update on recipes
  for each row execute function set_updated_at();

-- 4.4 recipe_flour_map（レシピ×銘柄の紐付け）
create table recipe_flour_map (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  flour_brand_id uuid not null references flour_brands(id) on delete cascade,
  verification_status text not null check (verification_status in ('baked', 'visual')),
  result_memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recipe_id, flour_brand_id)
);

create index recipe_flour_map_flour_brand_id_idx on recipe_flour_map(flour_brand_id);

create trigger set_recipe_flour_map_updated_at
  before update on recipe_flour_map
  for each row execute function set_updated_at();

-- 4.5 result_tags（仕上がりタグマスタ）
create table result_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_result_tags_updated_at
  before update on result_tags
  for each row execute function set_updated_at();

-- 4.5 recipe_flour_result_tags（recipe_flour_map×result_tagsの多対多）
create table recipe_flour_result_tags (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references recipe_flour_map(id) on delete cascade,
  tag_id uuid not null references result_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (map_id, tag_id)
);

create index recipe_flour_result_tags_tag_id_idx on recipe_flour_result_tags(tag_id);

create trigger set_recipe_flour_result_tags_updated_at
  before update on recipe_flour_result_tags
  for each row execute function set_updated_at();
