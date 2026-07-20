"use client";

// WBS 5.4 / issue #106: レシピ一覧の絞り込み（銘柄／パン種別／グルテンフリー／
// サイリウムなし／油なし／銘柄特定済み）。
// データはISRで全件取得済みのため、絞り込みはクライアント側で行い、
// 条件はURLクエリに同期して共有可能にする。
// 絞り込みの判定ロジックは src/lib/filters.ts 側に置く。

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { filterRecipes } from "@/lib/filters";
import type { BreadType, Recipe } from "@/lib/types";
import { RecipeGrid } from "./recipe-grid";

/** 絞り込みに使う銘柄の選択肢（表示名つき） */
export type BrandOption = { id: string; name: string };

type Props = {
  recipes: Recipe[];
  breadTypes: BreadType[];
  brands: BrandOption[];
};

const selectClass =
  "rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-700";

export function RecipeFilters({ recipes, breadTypes, brands }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const brandId = searchParams.get("brand") ?? "";
  const breadType = searchParams.get("type") ?? "";
  const glutenFreeOnly = searchParams.get("gf") === "1";
  const psylliumFreeOnly = searchParams.get("pf") === "1";
  const oilFreeOnly = searchParams.get("of") === "1";
  const specifiedOnly = searchParams.get("sp") === "1";
  const hasFilter =
    brandId !== "" ||
    breadType !== "" ||
    glutenFreeOnly ||
    psylliumFreeOnly ||
    oilFreeOnly ||
    specifiedOnly;

  const filtered = useMemo(
    () =>
      filterRecipes(recipes, {
        brandId,
        breadType,
        glutenFreeOnly,
        psylliumFreeOnly,
        oilFreeOnly,
        specifiedOnly,
      }),
    [
      recipes,
      brandId,
      breadType,
      glutenFreeOnly,
      psylliumFreeOnly,
      oilFreeOnly,
      specifiedOnly,
    ],
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
          銘柄
          <select
            className={selectClass}
            value={brandId}
            onChange={(e) => updateParam("brand", e.target.value)}
          >
            <option value="">すべて</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          パン種別
          <select
            className={selectClass}
            value={breadType}
            onChange={(e) => updateParam("type", e.target.value)}
          >
            <option value="">すべて</option>
            {breadTypes.map((type) => (
              <option key={type.id} value={type.name}>
                {type.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            className="size-4 accent-amber-700"
            checked={specifiedOnly}
            onChange={(e) => updateParam("sp", e.target.checked ? "1" : "")}
          />
          銘柄特定済み
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            className="size-4 accent-amber-700"
            checked={glutenFreeOnly}
            onChange={(e) => updateParam("gf", e.target.checked ? "1" : "")}
          />
          グルテンフリーのみ
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            className="size-4 accent-amber-700"
            checked={psylliumFreeOnly}
            onChange={(e) => updateParam("pf", e.target.checked ? "1" : "")}
          />
          サイリウムなし
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            className="size-4 accent-amber-700"
            checked={oilFreeOnly}
            onChange={(e) => updateParam("of", e.target.checked ? "1" : "")}
          />
          油なし
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
      <p className="mt-3 text-sm text-stone-500">{filtered.length}件のレシピ</p>
      <div className="mt-3">
        <RecipeGrid recipes={filtered} />
      </div>
    </div>
  );
}
