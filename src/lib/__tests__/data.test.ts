import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getRecipeById,
  getRecipes,
  getRecipesByBrandId,
} from "@/lib/data";
import { getSupabaseClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("@/lib/supabase", () => ({
  getSupabaseClient: vi.fn(),
}));

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

type QueryResult = { data: unknown; error: { message: string } | null };

/**
 * Supabaseのクエリビルダーを模したスタブ。どのメソッドチェーンでも
 * 最終的にawaitでresultが返る（ビルダーはthenableとして振る舞う）。
 */
function stubQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  for (const method of ["from", "select", "eq", "order", "limit", "maybeSingle"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.then = (resolve: (value: QueryResult) => void) => resolve(result);
  vi.mocked(getSupabaseClient).mockReturnValue(
    builder as unknown as SupabaseClient,
  );
  return builder;
}

beforeEach(() => {
  vi.clearAllMocks();
  // フォールバック時のconsole.errorはテスト出力を汚すため抑制する
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("withFallback（各取得関数のフォールバック動作）", () => {
  it("クエリ成功時はデータをそのまま返す", async () => {
    const rows = [{ id: VALID_UUID, title: "テストレシピ" }];
    stubQuery({ data: rows, error: null });
    await expect(getRecipes()).resolves.toEqual(rows);
  });

  it("Supabaseがエラーを返したらフォールバック値（空配列）を返す", async () => {
    stubQuery({ data: null, error: { message: "connection refused" } });
    await expect(getRecipes()).resolves.toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  it("クライアント生成自体が失敗（環境変数未設定など）してもフォールバック値を返す", async () => {
    vi.mocked(getSupabaseClient).mockImplementation(() => {
      throw new Error("環境変数が設定されていません");
    });
    await expect(getRecipes()).resolves.toEqual([]);
    await expect(getRecipeById(VALID_UUID)).resolves.toBeNull();
    expect(console.error).toHaveBeenCalledTimes(2);
  });
});

describe("getRecipeById", () => {
  it("uuid形式でないidはDBに問い合わせずnullを返す", async () => {
    await expect(getRecipeById("not-a-uuid")).resolves.toBeNull();
    expect(getSupabaseClient).not.toHaveBeenCalled();
  });

  it("uuid形式のidはクエリ結果を返す", async () => {
    const row = { id: VALID_UUID, title: "テストレシピ" };
    stubQuery({ data: row, error: null });
    await expect(getRecipeById(VALID_UUID)).resolves.toEqual(row);
  });
});

describe("感想（reviews）の取得", () => {
  it("getRecipesのクエリに感想の埋め込み（本文・工夫コメント・投稿者情報）が含まれる", async () => {
    const builder = stubQuery({ data: [], error: null });
    await getRecipes();
    const selectArg = vi.mocked(builder.select as (q: string) => unknown).mock
      .calls[0][0];
    expect(selectArg).toMatch(/reviews:reviews\(/);
    expect(selectArg).toContain("body");
    expect(selectArg).toContain("flour_tips");
    expect(selectArg).toContain("author_name");
    expect(selectArg).toContain("author_type");
  });

  it("getRecipesByBrandIdのクエリにも感想の埋め込みが含まれる", async () => {
    const builder = stubQuery({ data: [], error: null });
    await getRecipesByBrandId(VALID_UUID);
    const selectArg = vi.mocked(builder.select as (q: string) => unknown).mock
      .calls[0][0];
    expect(selectArg).toMatch(/reviews:reviews\(/);
  });
});

describe("レシピの材料使用有無（サイリウム・グルテン・油）の取得", () => {
  it("getRecipesのクエリに3カラムが含まれる", async () => {
    const builder = stubQuery({ data: [], error: null });
    await getRecipes();
    const selectArg = vi.mocked(builder.select as (q: string) => unknown).mock
      .calls[0][0];
    expect(selectArg).toContain("uses_psyllium");
    expect(selectArg).toContain("uses_gluten");
    expect(selectArg).toContain("uses_oil");
  });

  it("getRecipeByIdのクエリにも3カラムが含まれる", async () => {
    const builder = stubQuery({ data: null, error: null });
    await getRecipeById(VALID_UUID);
    const selectArg = vi.mocked(builder.select as (q: string) => unknown).mock
      .calls[0][0];
    expect(selectArg).toContain("uses_psyllium");
    expect(selectArg).toContain("uses_gluten");
    expect(selectArg).toContain("uses_oil");
  });
});

describe("getRecipesByBrandId", () => {
  it("uuid形式でないidはDBに問い合わせず空配列を返す", async () => {
    await expect(getRecipesByBrandId("1; drop table recipes")).resolves.toEqual(
      [],
    );
    expect(getSupabaseClient).not.toHaveBeenCalled();
  });

  it("公開中のレシピだけを新しい順に返す", async () => {
    const older = {
      verification_status: "baked",
      result_memo: null,
      recipe: {
        id: "r-old",
        title: "古いレシピ",
        status: "published",
        created_at: "2026-01-01T00:00:00Z",
      },
    };
    const newer = {
      verification_status: "visual",
      result_memo: null,
      recipe: {
        id: "r-new",
        title: "新しいレシピ",
        status: "published",
        created_at: "2026-06-01T00:00:00Z",
      },
    };
    const draft = {
      verification_status: "baked",
      result_memo: null,
      recipe: {
        id: "r-draft",
        title: "下書き",
        status: "draft",
        created_at: "2026-07-01T00:00:00Z",
      },
    };
    const orphan = { verification_status: "baked", result_memo: null, recipe: null };
    stubQuery({ data: [older, draft, newer, orphan], error: null });

    const result = await getRecipesByBrandId(VALID_UUID);
    expect(result.map((row) => row.recipe?.id)).toEqual(["r-new", "r-old"]);
  });
});
