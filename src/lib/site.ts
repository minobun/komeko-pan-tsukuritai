// サイト共通の定数（サイト名はWBS 1.4確定までの仮称）

export const SITE_NAME = "米粉パンつくりたい";

export const SITE_DESCRIPTION =
  "米粉パンのレシピを「使っている米粉銘柄」から探せるまとめサイト。実食確認済みレシピと銘柄ごとの成分情報・逆引きレシピ一覧を掲載しています。";

/** 問い合わせ・削除依頼フォーム（WBS 2.4のGoogleフォームURLを環境変数で差し込む） */
export const CONTACT_FORM_URL =
  process.env.NEXT_PUBLIC_CONTACT_FORM_URL ?? "";
