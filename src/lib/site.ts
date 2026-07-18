// サイト共通の定数（サイト名はWBS 1.4確定までの仮称）

import { env } from "./env";

export const SITE_NAME = "米粉パンつくりたい";

export const SITE_DESCRIPTION =
  "米粉パンのレシピを「使っている米粉銘柄」から探せるまとめサイト。実食確認済みレシピと銘柄ごとの成分情報・逆引きレシピ一覧を掲載しています。";

const FALLBACK_SITE_URL = "https://komeko-pan-tsukuritai.vercel.app";

/**
 * canonical・OGP・sitemapの絶対URL生成に使うベースURL（WBS 6.1/6.3）。
 * 独自ドメイン取得（WBS 7.1）後は NEXT_PUBLIC_SITE_URL で差し替える。
 * プレビューデプロイのcanonicalが本番を指すとインデックスが混線するため、
 * 本番以外ではVercelが自動で入れる VERCEL_URL を優先する。
 */
function resolveSiteUrl(): string {
  const configured = env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const vercelUrl = env.VERCEL_URL;
  if (vercelUrl && env.VERCEL_ENV !== "production") {
    return `https://${vercelUrl}`;
  }
  return FALLBACK_SITE_URL;
}

export const SITE_URL = resolveSiteUrl();

/** ページの相対パスから絶対URLを作る */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** 問い合わせ・削除依頼フォーム（WBS 2.4のGoogleフォームURLを環境変数で差し込む） */
export const CONTACT_FORM_URL = env.NEXT_PUBLIC_CONTACT_FORM_URL ?? "";
