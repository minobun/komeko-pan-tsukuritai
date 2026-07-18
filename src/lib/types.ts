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

/**
 * レシピ×米粉の紐付け根拠（spec §4.4）。
 * 「実食したか」は紐付けの根拠ではなく感想側の情報なので、ここには含めない（{@link hasBakedReview}）。
 */
export type LinkStatus =
  /** レシピ本文中に銘柄の指定が明記されている */
  | "brand_specified"
  /** レシピに銘柄の記載はないが、その米粉で作った実績（感想）がある */
  | "brand_unspecified"
  /** レシピの写真・動画等から銘柄が目視で確認できる */
  | "visually_identified";

export type ResultTag = {
  id: string;
  name: string;
};

export type ReviewAuthorType = "operator" | "user";

/** レシピ×米粉の紐付け（recipe_flour_map）に蓄積される感想 */
export type Review = {
  id: string;
  body: string;
  flour_tips: string | null;
  author_name: string;
  author_type: ReviewAuthorType;
  created_at: string;
};

/** レシピに埋め込まれる使用銘柄（recipe_flour_map 経由） */
export type RecipeFlour = {
  link_status: LinkStatus;
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
  reviews: Review[];
};

export type Recipe = {
  id: string;
  title: string;
  url: string;
  site_name: string;
  author_name: string;
  memo: string | null;
  /** サイリウム使用有無。null は未確認 */
  uses_psyllium: boolean | null;
  /** グルテン使用有無。null は未確認 */
  uses_gluten: boolean | null;
  /** 油使用有無。null は未確認 */
  uses_oil: boolean | null;
  created_at: string;
  bread_type: Pick<BreadType, "id" | "name"> | null;
  flours: RecipeFlour[];
};

/** 銘柄詳細ページの逆引きレシピ（recipe_flour_map 起点） */
export type BrandRecipe = {
  link_status: LinkStatus;
  result_memo: string | null;
  reviews: Review[];
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

/** レシピ側の材料使用有無。DBの null は「未確認」として扱う */
export type IngredientUsage = "used" | "unused" | "unknown";

type RecipeIngredientKey = "uses_psyllium" | "uses_gluten" | "uses_oil";

/** 表示する材料と順序。項目の追加はこの配列への追記だけで済ませる */
const RECIPE_INGREDIENTS: { key: RecipeIngredientKey; label: string }[] = [
  { key: "uses_psyllium", label: "サイリウム" },
  { key: "uses_gluten", label: "グルテン" },
  { key: "uses_oil", label: "油" },
];

export type RecipeIngredientUsage = {
  key: RecipeIngredientKey;
  label: string;
  usage: IngredientUsage;
};

/** レシピの材料使用有無を、表示順に揃えたリストとして返す */
export function getRecipeIngredientUsages(
  recipe: Pick<Recipe, RecipeIngredientKey>,
): RecipeIngredientUsage[] {
  return RECIPE_INGREDIENTS.map(({ key, label }) => {
    const value = recipe[key];
    return {
      key,
      label,
      usage: value === null ? "unknown" : value ? "used" : "unused",
    };
  });
}

/**
 * 実食したかどうかは感想（reviews）の有無で表す（spec §4.4/§4.6）。
 * 紐付けステータスは根拠の種類しか表さないので、実食の判定には使わない。
 */
export function hasBakedReview(recipe: Pick<Recipe, "flours">): boolean {
  return recipe.flours.some((f) => f.reviews.length > 0);
}

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
