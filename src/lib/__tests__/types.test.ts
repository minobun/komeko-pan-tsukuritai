import { describe, expect, it } from "vitest";
import {
  getRecipeIngredientUsages,
  hasBakedReview,
  isGlutenFree,
  type Recipe,
  type RecipeFlour,
  type Review,
} from "@/lib/types";

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: "review-1",
    body: "もちもちに焼けた",
    flour_tips: null,
    author_name: "運営者",
    author_type: "operator",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeFlour(overrides: Partial<RecipeFlour> = {}): RecipeFlour {
  return {
    link_status: "brand_specified",
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

function makeRecipe(
  flours: RecipeFlour[],
  overrides: Partial<Recipe> = {},
): Recipe {
  return {
    id: "recipe-1",
    title: "テストレシピ",
    url: "https://example.com/recipe",
    site_name: "テストサイト",
    author_name: "テスト太郎",
    memo: null,
    uses_psyllium: null,
    uses_gluten: null,
    uses_oil: null,
    created_at: "2026-01-01T00:00:00Z",
    bread_type: null,
    flours,
    ...overrides,
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

describe("hasBakedReview", () => {
  it("感想が1件でもあれば実食済みとしてtrue", () => {
    const recipe = makeRecipe([makeFlour({ reviews: [makeReview()] })]);
    expect(hasBakedReview(recipe)).toBe(true);
  });

  it("複数銘柄のうち1つにだけ感想があってもtrue", () => {
    const recipe = makeRecipe([
      makeFlour(),
      makeFlour({ reviews: [makeReview()] }),
    ]);
    expect(hasBakedReview(recipe)).toBe(true);
  });

  it("感想が1件もなければfalse（紐付けステータスは実食の根拠にしない）", () => {
    const recipe = makeRecipe([
      makeFlour({ link_status: "brand_unspecified" }),
      makeFlour({ link_status: "visually_identified" }),
    ]);
    expect(hasBakedReview(recipe)).toBe(false);
  });

  it("銘柄が未紐付け（floursが空）ならfalse", () => {
    expect(hasBakedReview(makeRecipe([]))).toBe(false);
  });
});

describe("getRecipeIngredientUsages", () => {
  it("サイリウム・グルテン・油をこの順で返す", () => {
    const usages = getRecipeIngredientUsages(makeRecipe([]));
    expect(usages.map((u) => u.label)).toEqual(["サイリウム", "グルテン", "油"]);
  });

  it("trueは「使用あり」、falseは「使用なし」として返す", () => {
    const recipe = makeRecipe([], {
      uses_psyllium: true,
      uses_gluten: false,
      uses_oil: true,
    });
    expect(getRecipeIngredientUsages(recipe).map((u) => u.usage)).toEqual([
      "used",
      "unused",
      "used",
    ]);
  });

  it("nullは「未確認」として返す（既存レシピは全項目が未確認）", () => {
    expect(getRecipeIngredientUsages(makeRecipe([])).map((u) => u.usage)).toEqual(
      ["unknown", "unknown", "unknown"],
    );
  });
});
