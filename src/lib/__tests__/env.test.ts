// Issue #70: 環境変数の参照は src/lib/env.ts に集約する。
// どの環境変数がどこで使われているかを1箇所で把握できるよう、
// src/ 配下の他ファイルでの process.env 直接参照をソース走査で禁止する。

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { env } from "../env";

const SRC_DIR = join(process.cwd(), "src");

/** process.env の直接参照を許可する唯一のファイル */
const ENV_MODULE = "src/lib/env.ts";

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      // テストはモックのために process.env を触ることがあるため対象外
      return name === "__tests__" ? [] : listSourceFiles(path);
    }
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe("環境変数の集約（src/lib/env.ts）", () => {
  it("src/ 配下で process.env を直接参照するのは env.ts だけ", () => {
    const offenders = listSourceFiles(SRC_DIR)
      .filter((path) => readFileSync(path, "utf8").includes("process.env"))
      .map((path) => relative(process.cwd(), path))
      .filter((path) => path !== ENV_MODULE);
    expect(offenders).toEqual([]);
  });

  it("envモジュールは使用中の全環境変数をキーに持つ", () => {
    expect(Object.keys(env).sort()).toEqual(
      [
        "NEXT_PUBLIC_CONTACT_FORM_URL",
        "NEXT_PUBLIC_SITE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "NEXT_PUBLIC_SUPABASE_URL",
        "REVALIDATE_SECRET",
        "VERCEL_ENV",
        "VERCEL_URL",
      ].sort(),
    );
  });
});
