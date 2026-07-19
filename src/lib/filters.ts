// レシピ一覧・銘柄一覧の絞り込み判定。
// URLクエリとの同期などUI都合はコンポーネント側に残し、
// 判定ロジックだけをここに置いてユニットテスト可能にする。

import {
  getRecipeBrands,
  isGlutenFree,
  type BrandRecipe,
  type FlourBrand,
  type Recipe,
  type ReviewEntry,
} from "./types";

export type RecipeFilterCondition = {
  /** メーカー名。空文字は「すべて」 */
  maker: string;
  /** パン種別名。空文字は「すべて」 */
  breadType: string;
  glutenFreeOnly: boolean;
  /** サイリウム不使用（uses_psylliumがfalse）のみ。null（未確認）は含めない */
  psylliumFreeOnly: boolean;
};

export function matchesRecipeFilter(
  recipe: Recipe,
  cond: RecipeFilterCondition,
): boolean {
  // 記載・紐付けのどちらかにそのメーカーの銘柄があればヒットさせる（issue #94）
  if (
    cond.maker &&
    !getRecipeBrands(recipe).some((b) => b.maker?.name === cond.maker)
  ) {
    return false;
  }
  if (cond.breadType && recipe.bread_type?.name !== cond.breadType) {
    return false;
  }
  if (cond.glutenFreeOnly && !isGlutenFree(recipe)) return false;
  if (cond.psylliumFreeOnly && recipe.uses_psyllium !== false) return false;
  return true;
}

export function filterRecipes(
  recipes: Recipe[],
  cond: RecipeFilterCondition,
): Recipe[] {
  return recipes.filter((recipe) => matchesRecipeFilter(recipe, cond));
}

/** グルテン／サイリウムの三択条件。空文字は「すべて」 */
export type TriState = "" | "with" | "without";

export function matchesTriState(state: TriState, value: boolean): boolean {
  if (state === "with") return value;
  if (state === "without") return !value;
  return true;
}

/** レシピ詳細の感想を「使った銘柄」で絞り込む。空文字は「すべて」 */
export function filterReviewEntriesByBrand(
  entries: ReviewEntry[],
  brandId: string,
): ReviewEntry[] {
  if (!brandId) return entries;
  return entries.filter((entry) => entry.brand?.id === brandId);
}

/** 銘柄詳細の作れるレシピを「パン種別」で絞り込む。空文字は「すべて」 */
export function filterBrandRecipesByBreadType(
  rows: BrandRecipe[],
  breadType: string,
): BrandRecipe[] {
  if (!breadType) return rows;
  return rows.filter((row) => row.recipe?.bread_type?.name === breadType);
}

export type BrandFilterCondition = {
  gluten: TriState;
  psyllium: TriState;
};

export function filterBrands(
  brands: FlourBrand[],
  cond: BrandFilterCondition,
): FlourBrand[] {
  return brands.filter(
    (brand) =>
      matchesTriState(cond.gluten, brand.has_gluten) &&
      matchesTriState(cond.psyllium, brand.has_psyllium),
  );
}
