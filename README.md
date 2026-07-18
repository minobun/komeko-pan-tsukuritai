# komeko-pan-tsukuritai
米粉パンを作りたい人を応援するサイトです。

## 開発

```bash
npm install
cp .env.local.example .env.local  # 値を埋める
npm run dev
```

仕様は `docs/mvp/spec.md`、タスク分解は `docs/mvp/wbs.md` を参照。

## 環境変数

アプリ（`src/` 配下）の環境変数はすべて `src/lib/env.ts` 経由で参照する
（直接 `process.env` を参照しないこと。`src/lib/__tests__/env.test.ts` が検査する）。
一覧は `.env.local.example` と一致させる。

| 変数 | 用途 | 必須 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL | ✅（未設定でもビルド・表示は継続、データは空になる） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名キー | ✅（同上） |
| `REVALIDATE_SECRET` | 手動再検証 `POST /api/revalidate` の認証 | API利用時 |
| `NEXT_PUBLIC_SITE_URL` | canonical・OGP・sitemapの本番URL | 任意（未設定は *.vercel.app） |
| `NEXT_PUBLIC_CONTACT_FORM_URL` | お問い合わせフォームURL | 任意（未設定は「準備中」表示） |
| `VERCEL_URL` / `VERCEL_ENV` | Vercelが自動設定（プレビューURL・環境判定） | 設定不要 |

`scripts/check-links.mjs`（CI専用）は上記とは別に `SUPABASE_URL` /
`SUPABASE_SERVICE_ROLE_KEY` / `SITE_URL` / `REVALIDATE_SECRET` を使う
（下記「必要なリポジトリシークレット」参照）。

## リンク死活チェック（WBS 6.4）

`.github/workflows/link-check.yml` が毎週月曜9時（JST）に `scripts/check-links.mjs` を実行し、
レシピの外部リンクを確認して `recipes.status` を更新します。

- 404 / 410 / 接続不能 → `link_broken` に変更（一覧・詳細から自動的に外れる）
- 復活を検知したら `published` に戻す
- 403 / 429 などbot避けの可能性があるものは判定を保留し、statusを変えない
- `status = 'hidden'`（削除依頼対応）は対象外

実行結果はワークフローのサマリに出ます（週次の確認は WBS 8.2）。

### 必要なリポジトリシークレット

| シークレット | 用途 | 必須 |
| --- | --- | --- |
| `SUPABASE_URL` | Supabaseプロジェクトのurl | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | statusの更新（RLSをバイパスするため service_role が必要） | ✅ |
| `SITE_URL` | 更新後にISRキャッシュを再検証する対象 | 任意 |
| `REVALIDATE_SECRET` | 同上（`/api/revalidate` のシークレット） | 任意 |

手動実行は Actions タブの "Link check" から `workflow_dispatch` で行えます。
