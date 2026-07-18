"use client";

// 銘柄詳細の「この銘柄で作れるレシピ」一覧（issue #67）。
// パン種別で絞り込める。絞り込みの判定ロジックは src/lib/filters.ts 側に置く。

import { useMemo, useState } from "react";
import { filterBrandRecipesByBreadType } from "@/lib/filters";
import type { BrandRecipe } from "@/lib/types";
import { BrandRecipeCard } from "./brand-recipe-card";

export function BrandRecipeList({ rows }: { rows: BrandRecipe[] }) {
  const [breadType, setBreadType] = useState("");

  // フィルター候補は逆引きレシピに実際にあるパン種別だけ（重複除去）
  const breadTypeOptions = useMemo(() => {
    const names = rows.flatMap((row) =>
      row.recipe?.bread_type ? [row.recipe.bread_type.name] : [],
    );
    return Array.from(new Set(names));
  }, [rows]);

  const filtered = filterBrandRecipesByBreadType(rows, breadType);

  if (rows.length === 0) {
    return (
      <p className="mt-3 text-sm text-stone-500">
        この銘柄を使うレシピはまだ登録されていません。
      </p>
    );
  }

  return (
    <div>
      {breadTypeOptions.length > 1 && (
        <label className="mt-3 flex items-center gap-2 text-sm text-stone-600">
          パン種別
          <select
            className="rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-700"
            value={breadType}
            onChange={(e) => setBreadType(e.target.value)}
          >
            <option value="">すべて</option>
            {breadTypeOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      )}
      {filtered.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">
          このパン種別のレシピはありません。
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {filtered.map((row) => (
            <li key={row.recipe!.id}>
              <BrandRecipeCard row={row} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
