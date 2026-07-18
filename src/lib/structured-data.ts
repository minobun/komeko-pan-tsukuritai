// WBS 6.2: schema.org 構造化データの組み立て（docs/mvp/spec.md §9）
//
// レシピ本文は自前で保有していないため Recipe 型は名乗らない。
// 銘柄は Product、一覧は ItemList、パンくずは BreadcrumbList のみを出す。

import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site";
import type { BrandRecipe, FlourBrand, Recipe } from "./types";

/** トップページに出すサイト全体の定義 */
export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "ja",
  };
}

/** パンくず。表示中のパンくずナビと同じ階層を渡す */
export function buildBreadcrumbSchema(
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * 一覧ページのItemList。
 * 個々の要素は詳細ページのURLだけを持たせ、内容は詳細ページ側の型に委ねる。
 */
export function buildItemListSchema(
  name: string,
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}

/** 銘柄詳細のProduct。価格は保持していないためoffersは出さない */
export function buildBrandProductSchema(
  brand: FlourBrand,
  brandRecipes: BrandRecipe[],
) {
  const name = `${brand.maker_name} ${brand.product_name}`;
  const properties = [
    { name: "製パン用グルテン", value: brand.has_gluten ? "あり" : "なし" },
    { name: "サイリウム", value: brand.has_psyllium ? "あり" : "なし" },
    brand.origin && { name: "原材料米の産地", value: brand.origin },
  ].filter((p): p is { name: string; value: string } => Boolean(p));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    url: absoluteUrl(`/brands/${brand.id}`),
    brand: { "@type": "Brand", name: brand.maker_name },
    category: "米粉",
    description:
      brand.note ??
      `${name}の成分情報と、この米粉で作れる米粉パンレシピ${brandRecipes.length}件の逆引き一覧。`,
    ...(brand.image_url ? { image: brand.image_url } : {}),
    ...(brand.jan_code ? { gtin13: brand.jan_code } : {}),
    additionalProperty: properties.map((p) => ({
      "@type": "PropertyValue",
      name: p.name,
      value: p.value,
    })),
  };
}

/** レシピ詳細で「そのレシピが使っている銘柄」をItemListとして出す */
export function buildRecipeBrandListSchema(recipe: Recipe) {
  const brands = recipe.flours.flatMap((f) => (f.brand ? [f.brand] : []));
  return buildItemListSchema(
    `${recipe.title}で使われている米粉銘柄`,
    brands.map((brand) => ({
      name: `${brand.maker_name} ${brand.product_name}`,
      path: `/brands/${brand.id}`,
    })),
  );
}
