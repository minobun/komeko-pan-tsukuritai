// docs/mvp/spec.md §4 のデータモデルに対応する表示用の型定義

export type BreadType = {
  id: string;
  name: string;
  sort_order: number;
};

export type FlourBrand = {
  id: string;
  maker_name: string;
  product_name: string;
  is_bread_use: boolean;
  has_gluten: boolean;
  has_psyllium: boolean;
  origin: string | null;
  jan_code: string | null;
  official_url: string | null;
  image_url: string | null;
  purchase_url_amazon: string | null;
  purchase_url_rakuten: string | null;
  is_discontinued: boolean;
  note: string | null;
  created_at: string;
};

export type VerificationStatus = "baked" | "visual";

export type ResultTag = {
  id: string;
  name: string;
};

/** レシピに埋め込まれる使用銘柄（recipe_flour_map 経由） */
export type RecipeFlour = {
  verification_status: VerificationStatus;
  result_memo: string | null;
  brand: Pick<
    FlourBrand,
    | "id"
    | "maker_name"
    | "product_name"
    | "has_gluten"
    | "has_psyllium"
    | "is_discontinued"
  > | null;
  tags: { tag: ResultTag | null }[];
};

export type Recipe = {
  id: string;
  title: string;
  url: string;
  site_name: string;
  author_name: string;
  memo: string | null;
  created_at: string;
  bread_type: Pick<BreadType, "id" | "name"> | null;
  flours: RecipeFlour[];
};

/** 銘柄詳細ページの逆引きレシピ（recipe_flour_map 起点） */
export type BrandRecipe = {
  verification_status: VerificationStatus;
  result_memo: string | null;
  recipe: {
    id: string;
    title: string;
    site_name: string;
    author_name: string;
    status: string;
    created_at: string;
    bread_type: Pick<BreadType, "id" | "name"> | null;
  } | null;
};

/**
 * 紐づく銘柄がすべてグルテンなしのレシピを「グルテンフリー」と扱う。
 * 銘柄未紐付けのレシピは判定不能なので false。
 */
export function isGlutenFree(recipe: Recipe): boolean {
  return (
    recipe.flours.length > 0 &&
    recipe.flours.every((f) => f.brand !== null && !f.brand.has_gluten)
  );
}
