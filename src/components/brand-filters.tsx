"use client";

// WBS 5.5: 銘柄一覧の絞り込み（グルテン／サイリウム）。
// レシピ一覧と同様、クライアント側で絞り込み、条件をURLクエリに同期する。
// 絞り込みの判定ロジックは src/lib/filters.ts 側に置く。

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { filterBrands, type TriState } from "@/lib/filters";
import type { FlourBrand } from "@/lib/types";
import { BrandList } from "./brand-list";

const selectClass =
  "rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-700";

type Props = {
  brands: FlourBrand[];
  /** 銘柄ID → 感想件数（BrandListへそのまま渡す） */
  reviewCounts: Record<string, number>;
};

export function BrandFilters({ brands, reviewCounts }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const gluten = (searchParams.get("gluten") ?? "") as TriState;
  const psyllium = (searchParams.get("psyllium") ?? "") as TriState;
  const hasFilter = gluten !== "" || psyllium !== "";

  const filtered = useMemo(
    () => filterBrands(brands, { gluten, psyllium }),
    [brands, gluten, psyllium],
  );

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-amber-100 bg-white p-3">
        <label className="flex items-center gap-2 text-sm text-stone-600">
          グルテン
          <select
            className={selectClass}
            value={gluten}
            onChange={(e) => updateParam("gluten", e.target.value)}
          >
            <option value="">すべて</option>
            <option value="without">グルテンフリー</option>
            <option value="with">グルテン入り</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          サイリウム
          <select
            className={selectClass}
            value={psyllium}
            onChange={(e) => updateParam("psyllium", e.target.value)}
          >
            <option value="">すべて</option>
            <option value="with">配合あり</option>
            <option value="without">配合なし</option>
          </select>
        </label>
        {hasFilter && (
          <button
            type="button"
            className="text-sm font-medium text-amber-800 hover:underline"
            onClick={() => router.replace(pathname, { scroll: false })}
          >
            条件をクリア
          </button>
        )}
      </div>
      <p className="mt-3 text-sm text-stone-500">{filtered.length}件の銘柄</p>
      <div className="mt-3">
        <BrandList brands={filtered} reviewCounts={reviewCounts} />
      </div>
    </div>
  );
}
