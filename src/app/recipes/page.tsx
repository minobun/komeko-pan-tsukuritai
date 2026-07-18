import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { RecipeFilters } from "@/components/recipe-filters";
import { RecipeGrid } from "@/components/recipe-grid";
import { getBreadTypes, getRecipes } from "@/lib/data";
import { buildPageMetadata } from "@/lib/metadata";
import { buildItemListSchema } from "@/lib/structured-data";

export const revalidate = 3600;

export const metadata = buildPageMetadata({
  title: "米粉パンレシピ一覧｜使用米粉の銘柄つき",
  description:
    "米粉パンのレシピ一覧。使用している米粉のメーカー・パン種別（食パン／丸パン等）・グルテンフリーの有無で絞り込めます。銘柄の紐付けは運営者の独自調査（レシピ内の目視確認）によるものです。",
  path: "/recipes",
});

export default async function RecipesPage() {
  const [recipes, breadTypes] = await Promise.all([
    getRecipes(),
    getBreadTypes(),
  ]);

  const makers = Array.from(
    new Set(
      recipes.flatMap((recipe) =>
        recipe.flours.flatMap((f) => (f.brand?.maker ? [f.brand.maker.name] : [])),
      ),
    ),
  ).sort((a, b) => a.localeCompare(b, "ja"));

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
      <h1 className="text-2xl font-bold text-stone-900">米粉パンレシピ一覧</h1>
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
            makers={makers}
          />
        </Suspense>
      </div>
    </div>
  );
}
