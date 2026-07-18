import type { LinkStatus } from "@/lib/types";

/** 値の追加はこの定義への追記だけで済ませる（spec §4.4） */
const LINK_STATUS_BADGES: Record<
  LinkStatus,
  { label: string; className: string }
> = {
  brand_specified: {
    label: "銘柄指定あり",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  brand_unspecified: {
    label: "銘柄指定なし",
    className: "border-stone-200 bg-stone-50 text-stone-600",
  },
  visually_identified: {
    label: "目視で確認可能",
    className: "border-stone-300 bg-white text-stone-500",
  },
};

/** 紐付け根拠のバッジ（spec §2: 検証レベルの明示が差別化要素） */
export function LinkStatusBadge({ status }: { status: LinkStatus }) {
  const { label, className } = LINK_STATUS_BADGES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
