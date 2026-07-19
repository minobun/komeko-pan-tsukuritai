import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getBrandReviewCounts,
  getFlourBrandById,
  getFlourBrands,
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

/**
 * テーブルごとに別の結果を返すスタブ。逆引き（getRecipesByBrandId）のように
 * 1つの関数が複数テーブルを引く場合に使う。
 */
function stubQueryByTable(results: Record<string, QueryResult>) {
  const selects: Record<string, ReturnType<typeof vi.fn>> = {};
  const client = {
    from: vi.fn((table: string) => {
      const result = results[table] ?? { data: [], error: null };
      const builder: Record<string, unknown> = {};
      for (const method of ["select", "eq", "order", "limit", "maybeSingle"]) {
        builder[method] = vi.fn(() => builder);
      }
      selects[table] = builder.select as ReturnType<typeof vi.fn>;
      builder.then = (resolve: (value: QueryResult) => void) => resolve(result);
      return builder;
    }),
  };
  vi.mocked(getSupabaseClient).mockReturnValue(
    client as unknown as SupabaseClient,
  );
  return selects;
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
    const selects = stubQueryByTable({});
    await getRecipesByBrandId(VALID_UUID);
    expect(selects.recipe_flour_map.mock.calls[0][0]).toMatch(
      /reviews:reviews\(/,
    );
  });
});

describe("レシピ記載の米粉（recipe_specified_flours）の取得", () => {
  it("getRecipesのクエリに記載銘柄が根拠つきで埋め込まれる", async () => {
    const builder = stubQuery({ data: [], error: null });
    await getRecipes();
    const selectArg = vi.mocked(builder.select as (q: string) => unknown).mock
      .calls[0][0];
    expect(selectArg).toMatch(/specified_flours:recipe_specified_flours\(/);
    expect(selectArg).toContain("source");
  });

  it("紐付け側からは link_status を取得しない（#94でカラム廃止）", async () => {
    const builder = stubQuery({ data: [], error: null });
    await getRecipes();
    const selectArg = vi.mocked(builder.select as (q: string) => unknown).mock
      .calls[0][0];
    expect(selectArg).not.toContain("link_status");
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

describe("メーカーマスタ（makers）の取得", () => {
  it("getRecipesのクエリで銘柄にメーカーが埋め込まれる", async () => {
    const builder = stubQuery({ data: [], error: null });
    await getRecipes();
    const selectArg = vi.mocked(builder.select as (q: string) => unknown).mock
      .calls[0][0];
    expect(selectArg).toMatch(/maker:makers\(id, name\)/);
  });

  it("getFlourBrandsのクエリでもメーカーが埋め込まれる", async () => {
    const builder = stubQuery({ data: [], error: null });
    await getFlourBrands();
    const selectArg = vi.mocked(builder.select as (q: string) => unknown).mock
      .calls[0][0];
    expect(selectArg).toMatch(/maker:makers\(id, name\)/);
  });

  it("getFlourBrandByIdのクエリでもメーカーが埋め込まれる", async () => {
    const builder = stubQuery({ data: null, error: null });
    await getFlourBrandById(VALID_UUID);
    const selectArg = vi.mocked(builder.select as (q: string) => unknown).mock
      .calls[0][0];
    expect(selectArg).toMatch(/maker:makers\(id, name\)/);
  });

  it("getFlourBrandsはメーカー名→商品名の順に並べ替えて返す", async () => {
    const rows = [
      { id: "b-1", maker: { id: "m-2", name: "波里" }, product_name: "米粉" },
      {
        id: "b-2",
        maker: { id: "m-1", name: "共立食品" },
        product_name: "パン用米粉",
      },
      {
        id: "b-3",
        maker: { id: "m-1", name: "共立食品" },
        product_name: "お米の粉",
      },
    ];
    stubQuery({ data: rows, error: null });
    const result = await getFlourBrands();
    expect(result.map((b) => b.id)).toEqual(["b-3", "b-2", "b-1"]);
  });
});

describe("getBrandReviewCounts", () => {
  it("公開中レシピの紐付けに付いた感想を銘柄ごとに合算する", async () => {
    const rows = [
      {
        flour_brand_id: "b-1",
        reviews: [{ id: "rv-1" }, { id: "rv-2" }],
        recipe: { status: "published" },
      },
      {
        flour_brand_id: "b-1",
        reviews: [{ id: "rv-3" }],
        recipe: { status: "published" },
      },
      {
        flour_brand_id: "b-2",
        reviews: [],
        recipe: { status: "published" },
      },
    ];
    stubQuery({ data: rows, error: null });
    await expect(getBrandReviewCounts()).resolves.toEqual({
      "b-1": 3,
      "b-2": 0,
    });
  });

  it("非公開レシピの感想やレシピ欠損行は数えない", async () => {
    const rows = [
      {
        flour_brand_id: "b-1",
        reviews: [{ id: "rv-1" }],
        recipe: { status: "draft" },
      },
      { flour_brand_id: "b-2", reviews: [{ id: "rv-2" }], recipe: null },
      {
        flour_brand_id: "b-3",
        reviews: [{ id: "rv-3" }],
        recipe: { status: "published" },
      },
    ];
    stubQuery({ data: rows, error: null });
    await expect(getBrandReviewCounts()).resolves.toEqual({ "b-3": 1 });
  });

  it("取得に失敗したらフォールバック値（空オブジェクト）を返す", async () => {
    stubQuery({ data: null, error: { message: "connection refused" } });
    await expect(getBrandReviewCounts()).resolves.toEqual({});
    expect(console.error).toHaveBeenCalled();
  });
});

describe("getRecipesByBrandId", () => {
  it("uuid形式でないidはDBに問い合わせず空配列を返す", async () => {
    await expect(getRecipesByBrandId("1; drop table recipes")).resolves.toEqual(
      [],
    );
    expect(getSupabaseClient).not.toHaveBeenCalled();
  });

  const recipeOf = (id: string, status: string, created_at: string) => ({
    id,
    title: `レシピ${id}`,
    status,
    created_at,
  });

  it("公開中のレシピだけを新しい順に返す", async () => {
    const older = {
      result_memo: null,
      reviews: [],
      recipe: recipeOf("r-old", "published", "2026-01-01T00:00:00Z"),
    };
    const newer = {
      result_memo: null,
      reviews: [],
      recipe: recipeOf("r-new", "published", "2026-06-01T00:00:00Z"),
    };
    const draft = {
      result_memo: null,
      reviews: [],
      recipe: recipeOf("r-draft", "draft", "2026-07-01T00:00:00Z"),
    };
    const orphan = { result_memo: null, reviews: [], recipe: null };
    stubQueryByTable({
      recipe_flour_map: {
        data: [older, draft, newer, orphan],
        error: null,
      },
    });

    const result = await getRecipesByBrandId(VALID_UUID);
    expect(result.map((row) => row.recipe?.id)).toEqual(["r-new", "r-old"]);
  });

  it("紐付けと記載を突き合わせ、記載のあるレシピに根拠を付けて返す", async () => {
    const listed = recipeOf("r-listed", "published", "2026-06-01T00:00:00Z");
    const curated = recipeOf("r-curated", "published", "2026-01-01T00:00:00Z");
    stubQueryByTable({
      recipe_flour_map: {
        data: [
          { result_memo: null, reviews: [], recipe: listed },
          { result_memo: null, reviews: [], recipe: curated },
        ],
        error: null,
      },
      recipe_specified_flours: {
        data: [{ source: "text", recipe: listed }],
        error: null,
      },
    });

    const result = await getRecipesByBrandId(VALID_UUID);
    expect(
      result.map((row) => [row.recipe?.id, row.specified_source]),
    ).toEqual([
      ["r-listed", "text"],
      ["r-curated", null],
    ]);
  });

  it("紐付けがなく記載だけのレシピも逆引きに含める", async () => {
    stubQueryByTable({
      recipe_specified_flours: {
        data: [
          {
            source: "visual",
            recipe: recipeOf("r-only", "published", "2026-01-01T00:00:00Z"),
          },
        ],
        error: null,
      },
    });

    const result = await getRecipesByBrandId(VALID_UUID);
    expect(result.map((row) => row.recipe?.id)).toEqual(["r-only"]);
    expect(result[0].specified_source).toBe("visual");
  });

  it("記載側のクエリが失敗したらフォールバック値（空配列）を返す", async () => {
    stubQueryByTable({
      recipe_specified_flours: {
        data: null,
        error: { message: "connection refused" },
      },
    });
    await expect(getRecipesByBrandId(VALID_UUID)).resolves.toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });
});
