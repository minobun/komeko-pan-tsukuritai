// docs/mvp/spec.md §4 のデータモデルに対応する表示用の型定義

import { getGlossaryTerm, type GlossaryTermId } from "./glossary";

export type BreadType = {
  id: string;
  name: string;
  sort_order: number;
};

/** メーカー（製造会社）マスタ。spec §4.8 */
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
 * レシピ本文に記載された米粉の、記載根拠（spec §4.5 recipe_specified_flours）。
 *
 * これはレシピが決まれば変わらない静的な事実だけを表す。「この米粉で作った」という
 * サイト独自の実績は 4.4 recipe_flour_map の紐付けが、「実食したか」は感想の有無が表す
 * （{@link hasBakedReview}）。
 */
export type SpecifiedFlourSource =
  /** レシピ本文中に銘柄の指定が明記されている */
  | "text"
  /** レシピの写真・動画等から銘柄が目視で確認できる */
  | "visual";

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

/** 表示に必要な銘柄フィールドだけに絞った形（インターフェース分離） */
export type RecipeBrand = Pick<
  FlourBrand,
  | "id"
  | "maker"
  | "product_name"
  | "has_gluten"
  | "has_psyllium"
  | "is_discontinued"
>;

/**
 * レシピに紐付けた米粉（recipe_flour_map 経由）。根拠を問わないサイト独自の
 * キュレーションで、感想・仕上がりタグはここにぶら下がる（spec §4.4）。
 */
export type RecipeFlour = {
  result_memo: string | null;
  brand: RecipeBrand | null;
  tags: { tag: ResultTag | null }[];
  reviews: Review[];
};

/** レシピ本文に記載されている米粉（recipe_specified_flours 経由。spec §4.5） */
export type SpecifiedFlour = {
  source: SpecifiedFlourSource;
  brand: RecipeBrand | null;
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
  /** サイト独自の紐付け（4.4）。レシピ記載の有無は問わない */
  flours: RecipeFlour[];
  /** レシピ本文に記載されている米粉（4.5） */
  specified_flours: SpecifiedFlour[];
};

/** 逆引きで返すレシピの最小情報 */
export type BrandRecipeSummary = {
  id: string;
  title: string;
  site_name: string;
  author_name: string;
  status: string;
  created_at: string;
  bread_type: Pick<BreadType, "id" | "name"> | null;
};

/**
 * 銘柄詳細ページの逆引きレシピ。4.4 の紐付けと 4.5 の記載を
 * レシピ単位でまとめた和集合の1行（{@link mergeBrandRecipes}）。
 */
export type BrandRecipe = {
  /** レシピ側の記載根拠。レシピに記載がなく紐付けだけの場合は null */
  specified_source: SpecifiedFlourSource | null;
  result_memo: string | null;
  reviews: Review[];
  recipe: BrandRecipeSummary | null;
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

/**
 * 表示する材料と順序。項目の追加はこの配列への追記だけで済ませる。
 * 材料名は用語集に定義があるものを使い、表記をそちらに一本化する（issue #101）
 */
const RECIPE_INGREDIENTS: {
  key: RecipeIngredientKey;
  glossaryId: GlossaryTermId;
}[] = [
  { key: "uses_psyllium", glossaryId: "psyllium" },
  { key: "uses_gluten", glossaryId: "gluten" },
  { key: "uses_oil", glossaryId: "oil" },
];

export type RecipeIngredientUsage = {
  key: RecipeIngredientKey;
  /** 用語集の見出し語。表示名としてそのまま使える */
  label: string;
  /** 用語の説明を引くためのID */
  glossaryId: GlossaryTermId;
  usage: IngredientUsage;
};

/** レシピの材料使用有無を、表示順に揃えたリストとして返す */
export function getRecipeIngredientUsages(
  recipe: Pick<Recipe, RecipeIngredientKey>,
): RecipeIngredientUsage[] {
  return RECIPE_INGREDIENTS.map(({ key, glossaryId }) => {
    const value = recipe[key];
    return {
      key,
      label: getGlossaryTerm(glossaryId).term,
      glossaryId,
      usage: value === null ? "unknown" : value ? "used" : "unused",
    };
  });
}

/**
 * 実食したかどうかは感想（reviews）の有無で表す（spec §4.4/§4.7）。
 * 紐付けや記載根拠は「作れる」ことしか表さないので、実食の判定には使わない。
 */
export function hasBakedReview(recipe: Pick<Recipe, "flours">): boolean {
  return recipe.flours.some((f) => f.reviews.length > 0);
}

/** レシピに紐づく感想（全銘柄分）の合計件数。一覧の「感想 n件」表示に使う */
export function countReviews(recipe: Pick<Recipe, "flours">): number {
  return recipe.flours.reduce((sum, f) => sum + f.reviews.length, 0);
}

/** レシピ詳細に並べる「レシピに記載のある米粉」1件。記載の事実に紐付け側の情報を重ねたもの */
export type ListedFlour = SpecifiedFlour & {
  result_memo: string | null;
  tags: { tag: ResultTag | null }[];
  reviews: Review[];
};

/**
 * レシピに記載のある米粉（4.5）を、同じ銘柄の紐付け（4.4）が持つ感想・メモ・タグを
 * 重ねて返す。記載外の銘柄で作った感想はレシピ側の情報ではないので、
 * レシピ詳細では感想セクション（{@link getReviewEntries}）で扱う（issue #66 / #94）。
 */
export function getListedFlours(
  recipe: Pick<Recipe, "flours" | "specified_flours">,
): ListedFlour[] {
  return recipe.specified_flours.map((specified) => {
    // 銘柄が取得できていない記載行は結合先を特定できないため、紐付けを重ねない
    const link = specified.brand
      ? recipe.flours.find((f) => f.brand?.id === specified.brand!.id)
      : undefined;
    return {
      ...specified,
      result_memo: link?.result_memo ?? null,
      tags: link?.tags ?? [],
      reviews: link?.reviews ?? [],
    };
  });
}

/**
 * レシピに関係する銘柄（記載＋紐付け）を重複なく返す。
 * メタデータ・構造化データ・絞り込みなど「このレシピの銘柄」を扱う箇所で使う。
 */
export function getRecipeBrands(
  recipe: Pick<Recipe, "flours" | "specified_flours">,
): RecipeBrand[] {
  const brands = [...recipe.specified_flours, ...recipe.flours].flatMap((f) =>
    f.brand ? [f.brand] : [],
  );
  return brands.filter(
    (brand, i) => brands.findIndex((b) => b.id === brand.id) === i,
  );
}

/** 感想1件と、その感想で使った銘柄の組（レシピ詳細の感想セクション用） */
export type ReviewEntry = {
  review: Review;
  brand: RecipeFlour["brand"];
};

/**
 * レシピに紐づく全感想を、使った銘柄の情報つきで新しい順に返す。
 * レシピ記載外の米粉で作った感想も含む（issue #66）。
 */
export function getReviewEntries(recipe: Pick<Recipe, "flours">): ReviewEntry[] {
  return recipe.flours
    .flatMap((f) => f.reviews.map((review) => ({ review, brand: f.brand })))
    .sort((a, b) => (a.review.created_at < b.review.created_at ? 1 : -1));
}

/**
 * 銘柄詳細の「この銘柄で作れるレシピ」。レシピ側に記載の根拠があるものを返す（issue #67）。
 */
export function getConfirmedBrandRecipes(rows: BrandRecipe[]): BrandRecipe[] {
  return rows.filter((row) => row.specified_source !== null);
}

/**
 * 銘柄詳細の「作れるかも？」レシピ。レシピ本文に記載はないが、
 * この米粉で紐付けているもの（＝ 4.5 に対応行がない紐付け）を返す（issue #67 / #94）。
 */
export function getPossibleBrandRecipes(rows: BrandRecipe[]): BrandRecipe[] {
  return rows.filter((row) => row.specified_source === null);
}

/** 逆引きの元になる recipe_flour_map の行（紐付け側） */
export type BrandRecipeLinkRow = {
  result_memo: string | null;
  reviews: Review[];
  recipe: BrandRecipeSummary | null;
};

/** 逆引きの元になる recipe_specified_flours の行（レシピ記載側） */
export type BrandRecipeSpecifiedRow = {
  source: SpecifiedFlourSource;
  recipe: BrandRecipeSummary | null;
};

/**
 * 逆引き用に 4.4 の紐付けと 4.5 の記載をレシピ単位でまとめ、公開中のものだけを
 * 新しい順に返す（spec §4.5「表示・逆引きは 4.4 と 4.5 の和集合を使う」）。
 *
 * 同じ (レシピ, 銘柄) が両方に存在しうるため、レシピIDで突き合わせて1行にする。
 */
export function mergeBrandRecipes(
  links: BrandRecipeLinkRow[],
  specified: BrandRecipeSpecifiedRow[],
): BrandRecipe[] {
  const sourceByRecipeId = new Map(
    specified.flatMap((row) => (row.recipe ? [[row.recipe.id, row]] : [])),
  );
  const merged = new Map<string, BrandRecipe>();

  for (const link of links) {
    if (!link.recipe) continue;
    merged.set(link.recipe.id, {
      specified_source: sourceByRecipeId.get(link.recipe.id)?.source ?? null,
      result_memo: link.result_memo,
      reviews: link.reviews,
      recipe: link.recipe,
    });
  }
  // 紐付けがなく記載だけのレシピも「作れるレシピ」として逆引きに出す
  for (const row of specified) {
    if (!row.recipe || merged.has(row.recipe.id)) continue;
    merged.set(row.recipe.id, {
      specified_source: row.source,
      result_memo: null,
      reviews: [],
      recipe: row.recipe,
    });
  }

  return [...merged.values()]
    .filter((row) => row.recipe!.status === "published")
    .sort((a, b) => (a.recipe!.created_at < b.recipe!.created_at ? 1 : -1));
}

/**
 * 関係する銘柄（記載＋紐付け）がすべてグルテンなしのレシピを「グルテンフリー」と扱う。
 * 銘柄が1つもない、または銘柄未取得の行があるレシピは判定不能なので false。
 */
export function isGlutenFree(
  recipe: Pick<Recipe, "flours" | "specified_flours">,
): boolean {
  const rows = [...recipe.specified_flours, ...recipe.flours];
  return (
    rows.length > 0 && rows.every((f) => f.brand !== null && !f.brand.has_gluten)
  );
}
