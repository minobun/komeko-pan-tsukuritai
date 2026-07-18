// レシピ一覧・銘柄一覧の絞り込み判定。
// URLクエリとの同期などUI都合はコンポーネント側に残し、
// 判定ロジックだけをここに置いてユニットテスト可能にする。

import { isGlutenFree, type FlourBrand, type Recipe } from "./types";

export type RecipeFilterCondition = {
  /** メーカー名。空文字は「すべて」 */
  maker: string;
  /** パン種別名。空文字は「すべて」 */
  breadType: string;
  glutenFreeOnly: boolean;
};

export function matchesRecipeFilter(
  recipe: Recipe,
  cond: RecipeFilterCondition,
): boolean {
  if (
    cond.maker &&
    !recipe.flours.some((f) => f.brand?.maker?.name === cond.maker)
  ) {
    return false;
  }
  if (cond.breadType && recipe.bread_type?.name !== cond.breadType) {
    return false;
  }
  if (cond.glutenFreeOnly && !isGlutenFree(recipe)) return false;
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
