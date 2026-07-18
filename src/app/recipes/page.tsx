import type { Metadata } from "next";
import { Suspense } from "react";
import { RecipeFilters } from "@/components/recipe-filters";
import { RecipeGrid } from "@/components/recipe-grid";
import { getBreadTypes, getRecipes } from "@/lib/data";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "米粉パンレシピ一覧",
  description:
    "米粉パンのレシピ一覧。使用している米粉のメーカー・パン種別・グルテンフリーの有無で絞り込めます。",
};

export default async function RecipesPage() {
  const [recipes, breadTypes] = await Promise.all([
    getRecipes(),
    getBreadTypes(),
  ]);

  const makers = Array.from(
    new Set(
      recipes.flatMap((recipe) =>
        recipe.flours.flatMap((f) => (f.brand ? [f.brand.maker_name] : [])),
      ),
    ),
  ).sort((a, b) => a.localeCompare(b, "ja"));

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">米粉パンレシピ一覧</h1>
      <p className="mt-2 text-sm text-stone-600">
        レシピはすべて外部サイトへのリンクです。銘柄の紐付けは運営者の独自調査・実食確認によるものです。
      </p>
      <div className="mt-6">
        {/* useSearchParamsを使う絞り込みUIはハイドレーション後に有効化される。
            静的HTMLにはfallbackとして全件リストを含める */}
        <Suspense fallback={<RecipeGrid recipes={recipes} />}>
          <RecipeFilters
            recipes={recipes}
            breadTypes={breadTypes}
            makers={makers}
          />
        </Suspense>
      </div>
    </div>
  );
}
