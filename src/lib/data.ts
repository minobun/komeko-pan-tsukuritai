// WBS 5.1: データ取得層。ページから直接DBクエリを書かず、ここに集約する
// （将来の公開API転用を見据える。docs/mvp/spec.md §7-3）

import { getSupabaseClient } from "./supabase";
import { compareBrandsByName, mergeBrandRecipes } from "./types";
import type {
  BrandRecipe,
  BrandRecipeLinkRow,
  BrandRecipeSpecifiedRow,
  BreadType,
  FlourBrand,
  Recipe,
} from "./types";

// PostgRESTはuuid以外のidを400で弾くため、詳細系は事前に形式チェックして404扱いにする
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const REVIEW_SELECT = `reviews:reviews(id, body, flour_tips, author_name, author_type, created_at)`;

/** メーカーはマスタ（makers）にあるため、銘柄取得時は常に埋め込む */
const MAKER_SELECT = `maker:makers(id, name)`;

const BRAND_SELECT = `*, ${MAKER_SELECT}`;

/** レシピ詳細・一覧で銘柄を表示するのに必要なフィールド */
const RECIPE_BRAND_SELECT = `brand:flour_brands(id, product_name, has_gluten, has_psyllium, is_discontinued, ${MAKER_SELECT})`;

// 「レシピが記載している米粉」（specified_flours）と「サイト独自の紐付け」（flours）は
// 別の事実なので、それぞれ別テーブルから取得する（spec §4.4 / §4.5）
const RECIPE_SELECT = `
  id, title, url, site_name, author_name, memo,
  uses_psyllium, uses_gluten, uses_oil, created_at,
  bread_type:bread_types(id, name),
  flours:recipe_flour_map(
    result_memo,
    ${RECIPE_BRAND_SELECT},
    tags:recipe_flour_result_tags(tag:result_tags(id, name)),
    ${REVIEW_SELECT}
  ),
  specified_flours:recipe_specified_flours(
    source,
    ${RECIPE_BRAND_SELECT}
  )
`;

/**
 * DB未設定・Supabase休止・ネットワーク断など、閲覧不可能な状態でもサイト表示自体は
 * 継続させるため、失敗時はfallbackを返す（docs/mvp/spec.md §6）。
 */
async function withFallback<T>(
  label: string,
  fallback: T,
  run: () => Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (err) {
    console.error(`[data] ${label} failed, falling back:`, err);
    return fallback;
  }
}

export async function getRecipes(): Promise<Recipe[]> {
  return withFallback("getRecipes", [], async () => {
    const { data, error } = await getSupabaseClient()
      .from("recipes")
      .select(RECIPE_SELECT)
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`getRecipes failed: ${error.message}`);
    return (data ?? []) as unknown as Recipe[];
  });
}

export async function getLatestRecipes(limit: number): Promise<Recipe[]> {
  return withFallback("getLatestRecipes", [], async () => {
    const { data, error } = await getSupabaseClient()
      .from("recipes")
      .select(RECIPE_SELECT)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`getLatestRecipes failed: ${error.message}`);
    return (data ?? []) as unknown as Recipe[];
  });
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  if (!UUID_RE.test(id)) return null;
  return withFallback("getRecipeById", null, async () => {
    const { data, error } = await getSupabaseClient()
      .from("recipes")
      .select(RECIPE_SELECT)
      .eq("status", "published")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`getRecipeById failed: ${error.message}`);
    return data as unknown as Recipe | null;
  });
}

export async function getBreadTypes(): Promise<BreadType[]> {
  return withFallback("getBreadTypes", [], async () => {
    const { data, error } = await getSupabaseClient()
      .from("bread_types")
      .select("id, name, sort_order")
      .order("sort_order");
    if (error) throw new Error(`getBreadTypes failed: ${error.message}`);
    return (data ?? []) as BreadType[];
  });
}

export async function getFlourBrands(): Promise<FlourBrand[]> {
  return withFallback("getFlourBrands", [], async () => {
    const { data, error } = await getSupabaseClient()
      .from("flour_brands")
      .select(BRAND_SELECT);
    if (error) throw new Error(`getFlourBrands failed: ${error.message}`);
    // メーカー名は埋め込みカラムのためDB側で並べ替えられず、取得後に整列する
    return ((data ?? []) as unknown as FlourBrand[])
      .slice()
      .sort(compareBrandsByName);
  });
}

export async function getFeaturedBrands(limit: number): Promise<FlourBrand[]> {
  return withFallback("getFeaturedBrands", [], async () => {
    const { data, error } = await getSupabaseClient()
      .from("flour_brands")
      .select(BRAND_SELECT)
      .eq("is_discontinued", false)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`getFeaturedBrands failed: ${error.message}`);
    return (data ?? []) as unknown as FlourBrand[];
  });
}

export async function getFlourBrandById(
  id: string,
): Promise<FlourBrand | null> {
  if (!UUID_RE.test(id)) return null;
  return withFallback("getFlourBrandById", null, async () => {
    const { data, error } = await getSupabaseClient()
      .from("flour_brands")
      .select(BRAND_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`getFlourBrandById failed: ${error.message}`);
    return data as unknown as FlourBrand | null;
  });
}

/** getBrandReviewCounts が集計する recipe_flour_map の行 */
type BrandReviewCountRow = {
  flour_brand_id: string;
  reviews: { id: string }[];
  recipe: { status: string } | null;
};

/**
 * 銘柄ごとの感想件数（銘柄一覧の「感想 n件」表示用）。
 * 公開中レシピの紐付けに付いた感想のみを数える。紐付けのない銘柄はキー自体を持たない。
 */
export async function getBrandReviewCounts(): Promise<Record<string, number>> {
  return withFallback("getBrandReviewCounts", {}, async () => {
    const { data, error } = await getSupabaseClient()
      .from("recipe_flour_map")
      .select("flour_brand_id, reviews(id), recipe:recipes(status)");
    if (error) throw new Error(`getBrandReviewCounts failed: ${error.message}`);
    const rows = (data ?? []) as unknown as BrandReviewCountRow[];
    const counts: Record<string, number> = {};
    for (const row of rows) {
      if (row.recipe?.status !== "published") continue;
      counts[row.flour_brand_id] =
        (counts[row.flour_brand_id] ?? 0) + row.reviews.length;
    }
    return counts;
  });
}

const BRAND_RECIPE_SELECT = `
  recipe:recipes(
    id, title, site_name, author_name, status, created_at,
    bread_type:bread_types(id, name)
  )
`;

/**
 * 銘柄詳細の逆引き：その銘柄を使う公開中レシピの一覧。
 * 紐付け（4.4）と レシピ記載（4.5）は別テーブルなので両方引いて和集合を取る。
 */
export async function getRecipesByBrandId(
  brandId: string,
): Promise<BrandRecipe[]> {
  if (!UUID_RE.test(brandId)) return [];
  return withFallback("getRecipesByBrandId", [], async () => {
    const client = getSupabaseClient();
    const [links, specified] = await Promise.all([
      client
        .from("recipe_flour_map")
        .select(`result_memo, ${REVIEW_SELECT}, ${BRAND_RECIPE_SELECT}`)
        .eq("flour_brand_id", brandId),
      client
        .from("recipe_specified_flours")
        .select(`source, ${BRAND_RECIPE_SELECT}`)
        .eq("flour_brand_id", brandId),
    ]);
    if (links.error) {
      throw new Error(`getRecipesByBrandId failed: ${links.error.message}`);
    }
    if (specified.error) {
      throw new Error(`getRecipesByBrandId failed: ${specified.error.message}`);
    }
    return mergeBrandRecipes(
      (links.data ?? []) as unknown as BrandRecipeLinkRow[],
      (specified.data ?? []) as unknown as BrandRecipeSpecifiedRow[],
    );
  });
}
