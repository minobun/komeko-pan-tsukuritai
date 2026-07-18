// WBS 6.3: robots.txt
import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { absoluteUrl, SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // プレビューデプロイが本番と重複コンテンツ扱いされないよう、本番以外は全面拒否する
  const isProduction = !env.VERCEL_ENV || env.VERCEL_ENV === "production";

  if (!isProduction) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 再検証用エンドポイントはクロール対象にしない
      disallow: "/api/",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
