import { Suspense } from "react";
import { GlossaryTerm } from "@/components/glossary-term";
import { JsonLd } from "@/components/json-ld";
import { RecipeFilters } from "@/components/recipe-filters";
import { RecipeGrid } from "@/components/recipe-grid";
import { getBreadTypes, getRecipes } from "@/lib/data";
import { buildPageMetadata } from "@/lib/metadata";
import { buildItemListSchema } from "@/lib/structured-data";
import {
  compareBrandsByName,
  formatBrandName,
  getSpecifiedBrands,
  type RecipeBrand,
} from "@/lib/types";

export const revalidate = 300;

export const metadata = buildPageMetadata({
  title: "米粉パンレシピ一覧｜使用米粉の銘柄つき",
  description:
    "米粉パンのレシピ一覧。使用している米粉のメーカー・パン種別（食パン／丸パン等）・グルテンフリー・サイリウムなしで絞り込めます。銘柄の紐付けは運営者の独自調査（レシピ内の目視確認）によるものです。",
  path: "/recipes",
});

export default async function RecipesPage() {
  const [recipes, breadTypes] = await Promise.all([
    getRecipes(),
    getBreadTypes(),
  ]);

  // 銘柄フィルタの選択肢は、カードと同じくレシピ本文に記載のある米粉から作る（issue #106/#109）
  const brandById = new Map<string, RecipeBrand>();
  for (const recipe of recipes) {
    for (const brand of getSpecifiedBrands(recipe)) {
      brandById.set(brand.id, brand);
    }
  }
  const brands = [...brandById.values()]
    .sort(compareBrandsByName)
    .map((brand) => ({ id: brand.id, name: formatBrandName(brand) }));

  return (
    <div>
      <JsonLd
        data={buildItemListSchema(
          "米粉パンレシピ一覧",
          recipes.map((recipe) => ({
            name: recipe.title,
            path: `/recipes/${recipe.id}`,
          })),
        )}
      />
      <h1 className="text-2xl font-bold text-stone-900">
        <GlossaryTerm id="komeko" />
        パンレシピ一覧
      </h1>
      <p className="mt-2 text-sm text-stone-600">
        レシピはすべて外部サイトへのリンクです。銘柄の紐付けは運営者の独自調査（レシピ内の目視確認）によるものです。
      </p>
      <div className="mt-6">
        {/* useSearchParamsを使う絞り込みUIはハイドレーション後に有効化される。
            静的HTMLにはfallbackとして全件リストを含める */}
        <Suspense fallback={<RecipeGrid recipes={recipes} />}>
          <RecipeFilters
            recipes={recipes}
            breadTypes={breadTypes}
            brands={brands}
          />
        </Suspense>
      </div>
    </div>
  );
}
