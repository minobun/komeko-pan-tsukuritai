import type { VerificationStatus } from "@/lib/types";

/** 検証ステータスバッジ（spec §2: 検証レベルの明示が差別化要素） */
export function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (status === "baked") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-2 py-0.5 text-xs font-semibold text-white">
        実食確認済み
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-stone-300 bg-white px-2 py-0.5 text-xs font-medium text-stone-500">
      目視確認
    </span>
  );
}
