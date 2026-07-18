// WBS 5.1: データ取得層。ページから直接DBクエリを書かず、ここに集約する
// （将来の公開API転用を見据える。docs/mvp/spec.md §7-3）

import { getSupabaseClient } from "./supabase";
import type { BrandRecipe, BreadType, FlourBrand, Recipe } from "./types";

// PostgRESTはuuid以外のidを400で弾くため、詳細系は事前に形式チェックして404扱いにする
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RECIPE_SELECT = `
  id, title, url, site_name, author_name, memo, created_at,
  bread_type:bread_types(id, name),
  flours:recipe_flour_map(
    verification_status, result_memo,
    brand:flour_brands(id, maker_name, product_name, has_gluten, has_psyllium, is_discontinued),
    tags:recipe_flour_result_tags(tag:result_tags(id, name))
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
      .select("*")
      .order("maker_name")
      .order("product_name");
    if (error) throw new Error(`getFlourBrands failed: ${error.message}`);
    return (data ?? []) as FlourBrand[];
  });
}

export async function getFeaturedBrands(limit: number): Promise<FlourBrand[]> {
  return withFallback("getFeaturedBrands", [], async () => {
    const { data, error } = await getSupabaseClient()
      .from("flour_brands")
      .select("*")
      .eq("is_discontinued", false)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`getFeaturedBrands failed: ${error.message}`);
    return (data ?? []) as FlourBrand[];
  });
}

export async function getFlourBrandById(
  id: string,
): Promise<FlourBrand | null> {
  if (!UUID_RE.test(id)) return null;
  return withFallback("getFlourBrandById", null, async () => {
    const { data, error } = await getSupabaseClient()
      .from("flour_brands")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`getFlourBrandById failed: ${error.message}`);
    return data as FlourBrand | null;
  });
}

/** 銘柄詳細の逆引き：その銘柄を使う公開中レシピの一覧 */
export async function getRecipesByBrandId(
  brandId: string,
): Promise<BrandRecipe[]> {
  if (!UUID_RE.test(brandId)) return [];
  return withFallback("getRecipesByBrandId", [], async () => {
    const { data, error } = await getSupabaseClient()
      .from("recipe_flour_map")
      .select(
        `
        verification_status, result_memo,
        recipe:recipes(
          id, title, site_name, author_name, status, created_at,
          bread_type:bread_types(id, name)
        )
      `,
      )
      .eq("flour_brand_id", brandId);
    if (error) throw new Error(`getRecipesByBrandId failed: ${error.message}`);
    const rows = (data ?? []) as unknown as BrandRecipe[];
    return rows
      .filter((row) => row.recipe !== null && row.recipe.status === "published")
      .sort((a, b) => (a.recipe!.created_at < b.recipe!.created_at ? 1 : -1));
  });
}
