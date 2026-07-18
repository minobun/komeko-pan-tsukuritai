-- Issue #59: 紐付けステータスの再定義（verification_status → link_status）
-- 参照: docs/mvp/spec.md §4.4
--
-- 「実食したか」は紐付けの根拠ではなく感想（#57 reviews）側の情報なので、
-- 紐付けステータスは「そのレシピでその米粉がどう扱われているか」の根拠だけを表す3値に変える。
--   brand_specified     … レシピ本文中に銘柄の指定が明記されている
--   brand_unspecified   … レシピに銘柄の記載はないが、その米粉で作った実績（感想）がある
--   visually_identified … レシピの写真・動画等から銘柄が目視で確認できる

alter table recipe_flour_map
  rename column verification_status to link_status;

-- 列のリネームでは制約名は変わらないため、旧名を明示して落とす
alter table recipe_flour_map
  drop constraint if exists recipe_flour_map_verification_status_check;

-- 既存データの移行方針:
--   visual → visually_identified（目視確認という根拠がそのまま対応する）
--   baked  → brand_unspecified
--     bakedは「運営者が実際に焼いた」という実食の事実であり、レシピ本文が銘柄を
--     指定しているかは判別できない。3値のうち「その米粉で作った実績がある」ことだけは
--     全bakedレコードで確実に真なので、過剰主張にならない brand_unspecified を既定とする。
--     実際にはレシピ本文に銘柄指定があるものも含まれるため、移行後に運営者が内容を確認し
--     brand_specified / visually_identified へ手動で修正する（#59 のフォロー作業）。
--   実食の事実自体は #57 のマイグレーションで reviews へ移行済み。
update recipe_flour_map
set link_status = case link_status
  when 'visual' then 'visually_identified'
  when 'baked' then 'brand_unspecified'
  else link_status
end;

alter table recipe_flour_map
  add constraint recipe_flour_map_link_status_check
  check (link_status in ('brand_specified', 'brand_unspecified', 'visually_identified'));
