"use client";

// レシピ詳細の「このレシピで作った感想」セクション（issue #66）。
// レシピに記載のある米粉とは別に、実際に作った感想を銘柄フィルターつきで表示する。
// 絞り込みの判定ロジックは src/lib/filters.ts 側に置く。

import { useMemo, useState } from "react";
import { filterReviewEntriesByBrand } from "@/lib/filters";
import { formatBrandName, type ReviewEntry } from "@/lib/types";

export function RecipeReviewList({ entries }: { entries: ReviewEntry[] }) {
  const [brandId, setBrandId] = useState("");

  // フィルター候補は感想で実際に使われた銘柄だけ（重複除去）
  const brandOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const entry of entries) {
      if (entry.brand && !seen.has(entry.brand.id)) {
        seen.set(entry.brand.id, formatBrandName(entry.brand));
      }
    }
    return Array.from(seen, ([id, label]) => ({ id, label }));
  }, [entries]);

  const filtered = filterReviewEntriesByBrand(entries, brandId);

  if (entries.length === 0) {
    return (
      <p className="mt-3 text-sm text-stone-500">
        このレシピで作った感想はまだありません。
      </p>
    );
  }

  return (
    <div>
      {brandOptions.length > 1 && (
        <label className="mt-3 flex items-center gap-2 text-sm text-stone-600">
          使った銘柄
          <select
            className="rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-700"
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
          >
            <option value="">すべて</option>
            {brandOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {filtered.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">
          この銘柄で作った感想はまだありません。
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {filtered.map((entry) => (
            <li
              key={entry.review.id}
              className="rounded-lg border border-amber-100 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                {entry.brand && (
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-900">
                    {formatBrandName(entry.brand)}
                  </span>
                )}
                <span>
                  {entry.review.author_type === "operator"
                    ? "運営者"
                    : `${entry.review.author_name}さん`}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                {entry.review.body}
              </p>
              {entry.review.flour_tips && (
                <p className="mt-2 rounded bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  米粉の工夫：{entry.review.flour_tips}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
