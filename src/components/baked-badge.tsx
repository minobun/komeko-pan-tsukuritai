/**
 * 運営者が実際に焼いて確認したことを示すバッジ。
 * 実食の事実は紐付けステータスではなく感想（reviews）の有無で表す（spec §4.4/§4.6）。
 */
export function BakedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-2 py-0.5 text-xs font-semibold text-white">
      実食確認済み
    </span>
  );
}
