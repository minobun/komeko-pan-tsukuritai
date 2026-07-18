-- WBS 3.3: bread_types・result_tags のマスタ投入
-- 参照: docs/mvp/spec.md §4.2, §4.5

insert into bread_types (name, sort_order) values
  ('食パン', 1),
  ('丸パン', 2),
  ('蒸しパン', 3),
  ('ベーグル', 4),
  ('マフィン', 5),
  ('ピザ生地', 6),
  ('その他', 7)
on conflict (name) do nothing;

insert into result_tags (name) values
  ('もちもち'),
  ('ふわふわ'),
  ('しっとり'),
  ('パサつき'),
  ('ずっしり'),
  ('軽い')
on conflict (name) do nothing;
