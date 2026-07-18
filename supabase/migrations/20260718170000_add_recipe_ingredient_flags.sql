-- Issue #58: レシピにサイリウム・グルテン・油の使用有無を持たせる
-- 参照: docs/mvp/spec.md §4.1
--
-- サイリウム・グルテンは米粉自体ではなく「レシピ側で加えるかどうか」で決まる情報。
-- 油の使用有無も同様にレシピの属性なので recipes に持たせる。
-- 米粉銘柄側の flour_brands.has_gluten / has_psyllium は
-- （製パン用ミックス粉などグルテン入り・サイリウム配合の銘柄が存在するため）維持する。
--
-- nullable にして null を「未確認」として扱う。既存レシピはすべて未確認から始まり、
-- 調査済みのレシピだけ true / false を入れていく。

alter table recipes
  add column uses_psyllium boolean,
  add column uses_gluten boolean,
  add column uses_oil boolean;

comment on column recipes.uses_psyllium is 'サイリウム使用有無。null は未確認';
comment on column recipes.uses_gluten is 'グルテン使用有無。null は未確認';
comment on column recipes.uses_oil is '油使用有無。null は未確認';
