# komeko-pan-tsukuritai
米粉パンを作りたい人を応援するサイトです。

## 開発

```bash
npm install
cp .env.local.example .env.local  # 値を埋める
npm run dev
```

仕様は `docs/mvp/spec.md`、タスク分解は `docs/mvp/wbs.md` を参照。

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
