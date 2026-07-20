import type { SpecifiedFlourSource } from "@/lib/types";

/** 値の追加はこの定義への追記だけで済ませる（spec §4.5） */
const SOURCE_BADGES: Record<
  SpecifiedFlourSource,
  { label: string; className: string }
> = {
  text: {
    label: "レシピに銘柄記載",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  visual: {
    label: "写真から銘柄確認",
    className: "border-stone-300 bg-white text-stone-500",
  },
};

/**
 * レシピ記載の米粉の、記載根拠バッジ（spec §2: 検証レベルの明示が差別化要素）。
 * 「実食したか」は感想の有無で表すため、ここでは扱わない（BakedBadge）。
 */
export function SpecifiedFlourBadge({
  source,
}: {
  source: SpecifiedFlourSource;
}) {
  const { label, className } = SOURCE_BADGES[source];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
