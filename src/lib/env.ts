/**
 * 環境変数の一元参照モジュール（issue #70）。
 * src/ 配下では process.env を直接参照せず、必ずここを経由する
 * （env.test.ts がソース走査で強制する）。
 *
 * NEXT_PUBLIC_ 変数はビルド時に `process.env.NEXT_PUBLIC_X` という完全な形の
 * 参照ごとインライン展開されるため（node_modules/next/dist/docs/01-app/02-guides/
 * environment-variables.md）、動的アクセス（process.env[name] や env = process.env）
 * にはできない。1変数ずつ静的に参照すること。
 *
 * 一覧は .env.local.example および README の環境変数表と一致させる。
 */
export const env = {
  /** SupabaseプロジェクトURL（必須。未設定時はデータ取得がフォールバックに落ちる） */
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  /** Supabase匿名キー（必須。同上） */
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  /** canonical・OGP・sitemapに使う本番URL（任意。未設定時は*.vercel.appにフォールバック） */
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  /** お問い合わせ・削除依頼フォームURL（任意。未設定時は「準備中」表示） */
  NEXT_PUBLIC_CONTACT_FORM_URL: process.env.NEXT_PUBLIC_CONTACT_FORM_URL,
  /** 手動再検証 POST /api/revalidate の認証シークレット（API利用時は必須） */
  REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
  /** Vercelが自動設定するデプロイURL（ローカルでは未定義） */
  VERCEL_URL: process.env.VERCEL_URL,
  /** Vercelが自動設定する環境名 production / preview / development */
  VERCEL_ENV: process.env.VERCEL_ENV,
} as const;
