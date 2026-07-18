// docs/mvp/spec.md §4 のデータモデルに対応する表示用の型定義

export type BreadType = {
  id: string;
  name: string;
  sort_order: number;
};

/** メーカー（製造会社）マスタ。spec §4.7 */
export type Maker = {
  id: string;
  name: string;
  official_url: string | null;
};

export type FlourBrand = {
  id: string;
  /** 製造メーカー（makers への参照）。埋め込み取得に失敗した場合は null */
  maker: Pick<Maker, "id" | "name"> | null;
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
    | "maker"
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

/** 銘柄が持つメーカー情報の最小単位。表示系の関数はこれだけを受け取る */
type BrandMaker = Pick<FlourBrand, "maker">;
type BrandDisplayName = BrandMaker & Pick<FlourBrand, "product_name">;

/** メーカー名。メーカー未取得でも表示を壊さないよう空文字を返す */
export function getMakerName(brand: BrandMaker): string {
  return brand.maker?.name ?? "";
}

/** 一覧・構造化データで使う「メーカー名 商品名」形式の表示名 */
export function formatBrandName(brand: BrandDisplayName): string {
  return [getMakerName(brand), brand.product_name].filter(Boolean).join(" ");
}

/**
 * 銘柄一覧の表示順（メーカー名 → 商品名）。
 * メーカー名は埋め込み取得のためDB側で並べ替えられず、取得後にこれで整列する。
 */
export function compareBrandsByName(
  a: BrandDisplayName,
  b: BrandDisplayName,
): number {
  const byMaker = getMakerName(a).localeCompare(getMakerName(b), "ja");
  return byMaker !== 0
    ? byMaker
    : a.product_name.localeCompare(b.product_name, "ja");
}

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
 * レシピに記載のある米粉（銘柄指定あり・目視で確認可能）だけを返す。
 * 「銘柄指定なし」はレシピ側の情報ではなく感想側の実績なので、
 * レシピ詳細では感想セクション（{@link getReviewEntries}）で扱う（issue #66）。
 */
export function getListedFlours(recipe: Pick<Recipe, "flours">): RecipeFlour[] {
  return recipe.flours.filter((f) => f.link_status !== "brand_unspecified");
}

/** 感想1件と、その感想で使った銘柄の組（レシピ詳細の感想セクション用） */
export type ReviewEntry = {
  review: Review;
  brand: RecipeFlour["brand"];
};

/**
 * レシピに紐づく全感想を、使った銘柄の情報つきで新しい順に返す。
 * 銘柄指定なしの米粉で作った感想も含む（issue #66）。
 */
export function getReviewEntries(recipe: Pick<Recipe, "flours">): ReviewEntry[] {
  return recipe.flours
    .flatMap((f) => f.reviews.map((review) => ({ review, brand: f.brand })))
    .sort((a, b) => (a.review.created_at < b.review.created_at ? 1 : -1));
}

/**
 * 銘柄詳細の「この銘柄で作れるレシピ」。レシピ側に根拠がある紐付け
 * （銘柄指定あり・目視で確認可能）だけを返す（issue #67）。
 */
export function getConfirmedBrandRecipes(rows: BrandRecipe[]): BrandRecipe[] {
  return rows.filter((row) => row.link_status !== "brand_unspecified");
}

/**
 * 銘柄詳細の「作れるかも？」レシピ。レシピに記載はないが、
 * この米粉で作った実績（感想）がある紐付け（銘柄指定なし）を返す（issue #67）。
 */
export function getPossibleBrandRecipes(rows: BrandRecipe[]): BrandRecipe[] {
  return rows.filter((row) => row.link_status === "brand_unspecified");
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
