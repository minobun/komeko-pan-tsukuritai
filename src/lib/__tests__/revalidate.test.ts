// Issue #61: ISRの再検証間隔は300秒（5分）。
// Next.jsのセグメント設定 `export const revalidate` は静的に解析可能なリテラルで
// なければならず（node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md）、
// REVALIDATE_SECONDS のimportで一元化できない。
// そのため、各ファイルのリテラルが定数とずれていないことをソース走査で保証する。

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REVALIDATE_SECONDS } from "../supabase";

/** セグメント設定 `export const revalidate` を持つファイル一覧 */
const FILES_WITH_REVALIDATE = [
  "src/app/page.tsx",
  "src/app/recipes/page.tsx",
  "src/app/recipes/[id]/page.tsx",
  "src/app/brands/page.tsx",
  "src/app/brands/[id]/page.tsx",
  "src/app/sitemap.ts",
];

function readRevalidateLiteral(file: string): number | null {
  const source = readFileSync(join(process.cwd(), file), "utf8");
  const match = source.match(/^export const revalidate = (\d+);$/m);
  return match ? Number(match[1]) : null;
}

describe("ISR再検証間隔", () => {
  it("REVALIDATE_SECONDS は300秒（5分）である", () => {
    expect(REVALIDATE_SECONDS).toBe(300);
  });

  it.each(FILES_WITH_REVALIDATE)(
    "%s の revalidate が REVALIDATE_SECONDS と一致する",
    (file) => {
      expect(readRevalidateLiteral(file)).toBe(REVALIDATE_SECONDS);
    },
  );
});
