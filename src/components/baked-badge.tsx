/**
 * 運営者がそのレシピを実際に試したことを示すバッジ。
 * その事実は紐付けステータスではなく感想（reviews）の有無で表す（spec §4.4/§4.6）。
 */
export function BakedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-2 py-0.5 text-xs font-semibold text-white">
      運営者が試作済み
    </span>
  );
}
