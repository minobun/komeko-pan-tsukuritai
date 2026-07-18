// WBS 6.1: ページ単位のメタタグ・OGPの組み立て
//
// Next.jsのMetadataは openGraph / twitter を「マージではなく置き換え」で解決するため、
// ページ側で openGraph を部分的に書くと親（app/layout.tsx）のsiteName等が消える。
// 全ページこのヘルパー経由にして、指定漏れを防ぐ。

import type { Metadata } from "next";
import { SITE_NAME } from "./site";

/**
 * app/opengraph-image.tsx が生成する共通OG画像。
 * ルート直下のこのファイルはトップページには自動で紐づくが、openGraphを
 * 自前で持つページには引き継がれないため、明示的に参照する。
 */
const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME}｜米粉の銘柄からレシピを探す`,
};

type PageMetadataInput = {
  /** <title>に入る文字列。app/layout.tsx のtemplateでサイト名が付く */
  title: string;
  description: string;
  /** canonical・og:url に使う絶対パス（例: "/brands"） */
  path: string;
  /** レシピ・銘柄の個別ページは article 扱いにする */
  type?: "website" | "article";
};

export function buildPageMetadata({
  title,
  description,
  path,
  type = "website",
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      locale: "ja_JP",
      siteName: SITE_NAME,
      url: path,
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [OG_IMAGE],
    },
  };
}
