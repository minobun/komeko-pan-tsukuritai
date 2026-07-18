import { describe, expect, it } from "vitest";
import { isGlutenFree, type Recipe, type RecipeFlour } from "@/lib/types";

function makeFlour(overrides: Partial<RecipeFlour> = {}): RecipeFlour {
  return {
    verification_status: "baked",
    result_memo: null,
    brand: {
      id: "brand-1",
      maker_name: "テスト製粉",
      product_name: "テスト米粉",
      has_gluten: false,
      has_psyllium: false,
      is_discontinued: false,
    },
    tags: [],
    reviews: [],
    ...overrides,
  };
}

function makeRecipe(flours: RecipeFlour[]): Recipe {
  return {
    id: "recipe-1",
    title: "テストレシピ",
    url: "https://example.com/recipe",
    site_name: "テストサイト",
    author_name: "テスト太郎",
    memo: null,
    created_at: "2026-01-01T00:00:00Z",
    bread_type: null,
    flours,
  };
}

describe("isGlutenFree", () => {
  it("紐づく銘柄がすべてグルテンなしならtrue", () => {
    const recipe = makeRecipe([makeFlour(), makeFlour()]);
    expect(isGlutenFree(recipe)).toBe(true);
  });

  it("グルテン入りの銘柄が1つでもあればfalse", () => {
    const recipe = makeRecipe([
      makeFlour(),
      makeFlour({
        brand: {
          id: "brand-2",
          maker_name: "テスト製粉",
          product_name: "ミックス粉",
          has_gluten: true,
          has_psyllium: false,
          is_discontinued: false,
        },
      }),
    ]);
    expect(isGlutenFree(recipe)).toBe(false);
  });

  it("銘柄が未紐付け（floursが空）なら判定不能としてfalse", () => {
    expect(isGlutenFree(makeRecipe([]))).toBe(false);
  });

  it("brandがnullの行が含まれる場合は判定不能としてfalse", () => {
    const recipe = makeRecipe([makeFlour(), makeFlour({ brand: null })]);
    expect(isGlutenFree(recipe)).toBe(false);
  });
});
