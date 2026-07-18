"use client";

// WBS 5.4: レシピ一覧の絞り込み（メーカー／パン種別／グルテンフリー有無）。
// データはISRで全件取得済みのため、絞り込みはクライアント側で行い、
// 条件はURLクエリに同期して共有可能にする。

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { isGlutenFree, type BreadType, type Recipe } from "@/lib/types";
import { RecipeGrid } from "./recipe-grid";

type Props = {
  recipes: Recipe[];
  breadTypes: BreadType[];
  makers: string[];
};

const selectClass =
  "rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-700";

export function RecipeFilters({ recipes, breadTypes, makers }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const maker = searchParams.get("maker") ?? "";
  const breadType = searchParams.get("type") ?? "";
  const glutenFreeOnly = searchParams.get("gf") === "1";
  const hasFilter = maker !== "" || breadType !== "" || glutenFreeOnly;

  const filtered = useMemo(
    () =>
      recipes.filter((recipe) => {
        if (
          maker &&
          !recipe.flours.some((f) => f.brand?.maker_name === maker)
        ) {
          return false;
        }
        if (breadType && recipe.bread_type?.name !== breadType) return false;
        if (glutenFreeOnly && !isGlutenFree(recipe)) return false;
        return true;
      }),
    [recipes, maker, breadType, glutenFreeOnly],
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
          メーカー
          <select
            className={selectClass}
            value={maker}
            onChange={(e) => updateParam("maker", e.target.value)}
          >
            <option value="">すべて</option>
            {makers.map((name) => (
              <option key={name} value={name}>
                {name}
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
            checked={glutenFreeOnly}
            onChange={(e) => updateParam("gf", e.target.checked ? "1" : "")}
          />
          グルテンフリーのみ
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
