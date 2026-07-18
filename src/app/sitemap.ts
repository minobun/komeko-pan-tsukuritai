// WBS 6.3: サイトマップ。Search Consoleへの送信対象（WBS 7.3）
import type { MetadataRoute } from "next";
import { getFlourBrands, getRecipes } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

// 一覧ページと同じ間隔でDBを見に行く（Supabase Free休止対策、docs/mvp/spec.md §6）
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [recipes, brands] = await Promise.all([getRecipes(), getFlourBrands()]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/recipes"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/brands"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/about"), changeFrequency: "yearly", priority: 0.3 },
  ];

  // 銘柄詳細はSEOの主戦場なのでレシピ詳細より高い優先度を置く（docs/mvp/spec.md §5）
  const brandPages: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: absoluteUrl(`/brands/${brand.id}`),
    lastModified: brand.created_at,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const recipePages: MetadataRoute.Sitemap = recipes.map((recipe) => ({
    url: absoluteUrl(`/recipes/${recipe.id}`),
    lastModified: recipe.created_at,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...brandPages, ...recipePages];
}
