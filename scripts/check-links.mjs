// WBS 6.4: レシピ外部リンクの死活チェック（docs/mvp/spec.md §6）
//
// 週1でGitHub Actionsから実行し、リンク切れを recipes.status = 'link_broken' に落とす。
// 一覧・詳細のクエリは status = 'published' で絞っているため、更新するだけで表示から外れる。
//
// 必要な環境変数:
//   SUPABASE_URL              … Supabaseプロジェクトのurl
//   SUPABASE_SERVICE_ROLE_KEY … 書き込みにはRLSをバイパスするservice_roleキーが要る
//   SITE_URL, REVALIDATE_SECRET … 任意。あれば更新後にISRキャッシュを再検証する

import { createClient } from "@supabase/supabase-js";

const CONCURRENCY = 5;
const TIMEOUT_MS = 15_000;

// レシピサイトはbot避けで403/429/503を返すことがあり、これらを死活と扱うと
// 生きているレシピを誤って非公開にしてしまう。恒久的な消滅だけをリンク切れとする。
const DEAD_STATUS_CODES = new Set([404, 410]);

// 素のfetchはUA無しで弾かれるサイトが多いため、ブラウザ相当のUAを名乗る
const USER_AGENT =
  "Mozilla/5.0 (compatible; komeko-pan-tsukuritai-linkcheck/1.0; +https://github.com/minobun/komeko-pan-tsukuritai)";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`環境変数 ${name} が未設定です`);
    process.exit(1);
  }
  return value;
}

async function request(url, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 死活判定。exportしているのは単体で検証できるようにするため
 * @returns {Promise<{alive: boolean, detail: string}>}
 */
export async function checkUrl(url) {
  try {
    // HEADを拒否するサイトがあるため、非2xxならGETで確認し直す
    let res = await request(url, "HEAD");
    if (!res.ok) res = await request(url, "GET");

    if (res.ok) return { alive: true, detail: `${res.status}` };
    if (DEAD_STATUS_CODES.has(res.status)) {
      return { alive: false, detail: `HTTP ${res.status}` };
    }
    // 403/429/503など判断がつかないものは現状維持（誤検知で非公開にしない）
    return { alive: true, detail: `HTTP ${res.status}（判定保留）` };
  } catch (err) {
    const reason = err.name === "AbortError" ? "タイムアウト" : err.message;
    return { alive: false, detail: reason };
  }
}

/** 配列を並列数を絞って処理する */
async function mapWithConcurrency(items, limit, fn) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    (async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await fn(items[index]);
      }
    })(),
  );
  await Promise.all(workers);
  return results;
}

/** データ更新をサイトに反映させる（ISRのキャッシュを手動再検証する） */
async function revalidateSite() {
  const siteUrl = process.env.SITE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!siteUrl || !secret) return;

  try {
    const res = await fetch(
      `${siteUrl.replace(/\/+$/, "")}/api/revalidate?secret=${encodeURIComponent(secret)}`,
      { method: "POST" },
    );
    console.log(
      res.ok
        ? "サイトのキャッシュを再検証しました"
        : `再検証に失敗しました: HTTP ${res.status}`,
    );
  } catch (err) {
    console.error("再検証リクエストに失敗:", err.message);
  }
}

async function main() {
  const supabase = createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );

  // status = 'hidden' は削除依頼などの意図的な非公開なので、このスクリプトでは触らない
  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("id, title, url, status")
    .in("status", ["published", "link_broken"]);
  if (error) throw new Error(`レシピの取得に失敗: ${error.message}`);

  console.log(`${recipes.length}件のレシピURLをチェックします`);

  const checkedAt = new Date().toISOString();
  const results = await mapWithConcurrency(
    recipes,
    CONCURRENCY,
    async (recipe) => {
      const { alive, detail } = await checkUrl(recipe.url);
      const nextStatus = alive ? "published" : "link_broken";
      return { recipe, alive, detail, nextStatus };
    },
  );

  const changed = results.filter((r) => r.nextStatus !== r.recipe.status);
  const broken = results.filter((r) => !r.alive);

  // status据え置きの分は last_checked_at だけを1クエリでまとめて更新する
  const unchangedIds = results
    .filter((r) => r.nextStatus === r.recipe.status)
    .map((r) => r.recipe.id);
  if (unchangedIds.length > 0) {
    const { error: touchError } = await supabase
      .from("recipes")
      .update({ last_checked_at: checkedAt })
      .in("id", unchangedIds);
    if (touchError) {
      console.error(`last_checked_atの更新に失敗: ${touchError.message}`);
      process.exitCode = 1;
    }
  }

  for (const { recipe, nextStatus } of changed) {
    const { error: updateError } = await supabase
      .from("recipes")
      .update({ status: nextStatus, last_checked_at: checkedAt })
      .eq("id", recipe.id);
    if (updateError) {
      console.error(`更新に失敗 (${recipe.id}): ${updateError.message}`);
      process.exitCode = 1;
    }
  }

  for (const { recipe, detail, nextStatus } of changed) {
    const label = nextStatus === "link_broken" ? "リンク切れ" : "復活";
    console.log(`[${label}] ${recipe.title} (${recipe.url}) — ${detail}`);
  }

  console.log(
    `チェック完了: 全${results.length}件 / リンク切れ${broken.length}件 / status変更${changed.length}件`,
  );

  if (changed.length > 0) await revalidateSite();

  await writeJobSummary(results, changed, broken);
}

/** GitHub Actionsのサマリ欄に結果を出す（WBS 8.2の週次確認用） */
async function writeJobSummary(results, changed, broken) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;

  const lines = [
    "## リンク死活チェック結果",
    "",
    `- チェック件数: ${results.length}`,
    `- リンク切れ: ${broken.length}`,
    `- status変更: ${changed.length}`,
    "",
  ];

  if (changed.length > 0) {
    lines.push("| 変更 | レシピ | URL | 理由 |", "| --- | --- | --- | --- |");
    for (const { recipe, detail, nextStatus } of changed) {
      const label = nextStatus === "link_broken" ? "🔴 リンク切れ" : "🟢 復活";
      lines.push(`| ${label} | ${recipe.title} | ${recipe.url} | ${detail} |`);
    }
  } else {
    lines.push("status の変更はありませんでした。");
  }

  const { appendFile } = await import("node:fs/promises");
  await appendFile(summaryPath, `${lines.join("\n")}\n`);
}

// import時（テスト等）には実行しない
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
