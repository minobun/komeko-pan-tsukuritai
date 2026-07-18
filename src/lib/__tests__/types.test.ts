import {
  compareBrandsByName,
  countReviews,
  formatBrandName,
  getConfirmedBrandRecipes,
  getListedFlours,
  getMakerName,
  getPossibleBrandRecipes,
  getRecipeIngredientUsages,
  getReviewEntries,
  hasBakedReview,
  isGlutenFree,
  type BrandRecipe,
  type Recipe,
  type RecipeFlour,
  type Review,
} from "@/lib/types";
import { describe, expect, it } from "vitest";

function makeBrandRecipe(overrides: Partial<BrandRecipe> = {}): BrandRecipe {
  return {
    link_status: "brand_specified",
    result_memo: null,
    reviews: [],
    recipe: {
      id: "recipe-1",
      title: "テストレシピ",
      site_name: "テストサイト",
      author_name: "テスト太郎",
      status: "published",
      created_at: "2026-01-01T00:00:00Z",
      bread_type: { id: "bt-1", name: "食パン" },
    },
    ...overrides,
  };
}

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
      maker: { id: "maker-1", name: "テスト製粉" },
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

describe("getMakerName / formatBrandName", () => {
  const brand = {
    maker: { id: "maker-1", name: "テスト製粉" },
    product_name: "テスト米粉",
  };

  it("メーカー名を返す", () => {
    expect(getMakerName(brand)).toBe("テスト製粉");
  });

  it("メーカー名と商品名を並べた表示名を返す", () => {
    expect(formatBrandName(brand)).toBe("テスト製粉 テスト米粉");
  });

  it("makerがnullでも表示を壊さない（メーカー名は空文字・表示名は商品名のみ）", () => {
    const orphan = { maker: null, product_name: "テスト米粉" };
    expect(getMakerName(orphan)).toBe("");
    expect(formatBrandName(orphan)).toBe("テスト米粉");
  });
});

describe("compareBrandsByName", () => {
  const brand = (makerName: string | null, productName: string) => ({
    maker: makerName === null ? null : { id: `maker-${makerName}`, name: makerName },
    product_name: productName,
  });

  it("メーカー名の五十音順に並べる", () => {
    const brands = [brand("波里", "米粉"), brand("共立食品", "米粉")];
    expect(
      [...brands].sort(compareBrandsByName).map((b) => b.maker?.name),
    ).toEqual(["共立食品", "波里"]);
  });

  it("同じメーカーの中では商品名順に並べる", () => {
    const brands = [
      brand("波里", "パン用米粉"),
      brand("波里", "お米の粉"),
    ];
    expect(
      [...brands].sort(compareBrandsByName).map((b) => b.product_name),
    ).toEqual(["お米の粉", "パン用米粉"]);
  });

  it("makerがnullの銘柄が混ざってもエラーにならない", () => {
    const brands = [brand("波里", "米粉"), brand(null, "米粉")];
    expect(() => [...brands].sort(compareBrandsByName)).not.toThrow();
  });
});

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
          maker: { id: "maker-1", name: "テスト製粉" },
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

describe("countReviews", () => {
  it("全銘柄の感想数を合算する", () => {
    const recipe = makeRecipe([
      makeFlour({ reviews: [makeReview(), makeReview({ id: "review-2" })] }),
      makeFlour({ reviews: [makeReview({ id: "review-3" })] }),
    ]);
    expect(countReviews(recipe)).toBe(3);
  });

  it("感想がなければ0", () => {
    expect(countReviews(makeRecipe([makeFlour()]))).toBe(0);
  });

  it("銘柄が未紐付け（floursが空）なら0", () => {
    expect(countReviews(makeRecipe([]))).toBe(0);
  });
});

describe("getListedFlours", () => {
  it("「銘柄指定あり」「目視で確認可能」だけをレシピに記載のある米粉として返す", () => {
    const specified = makeFlour();
    const visual = makeFlour({ link_status: "visually_identified" });
    const unspecified = makeFlour({ link_status: "brand_unspecified" });
    const recipe = makeRecipe([specified, visual, unspecified]);
    expect(getListedFlours(recipe)).toEqual([specified, visual]);
  });

  it("該当がなければ空配列", () => {
    const recipe = makeRecipe([makeFlour({ link_status: "brand_unspecified" })]);
    expect(getListedFlours(recipe)).toEqual([]);
  });
});

describe("getReviewEntries", () => {
  it("全銘柄の感想を銘柄情報つきでフラットに返す（銘柄指定なしの感想も含む）", () => {
    const specified = makeFlour({
      reviews: [makeReview({ id: "rv-1", created_at: "2026-01-01T00:00:00Z" })],
    });
    const unspecified = makeFlour({
      link_status: "brand_unspecified",
      brand: {
        id: "brand-2",
        maker: { id: "maker-1", name: "テスト製粉" },
        product_name: "別の米粉",
        has_gluten: false,
        has_psyllium: false,
        is_discontinued: false,
      },
      reviews: [makeReview({ id: "rv-2", created_at: "2026-02-01T00:00:00Z" })],
    });
    const entries = getReviewEntries(makeRecipe([specified, unspecified]));
    expect(entries.map((e) => e.review.id)).toEqual(["rv-2", "rv-1"]);
    expect(entries.map((e) => e.brand?.id)).toEqual(["brand-2", "brand-1"]);
  });

  it("感想は新しい順に並ぶ", () => {
    const flour = makeFlour({
      reviews: [
        makeReview({ id: "rv-old", created_at: "2026-01-01T00:00:00Z" }),
        makeReview({ id: "rv-new", created_at: "2026-06-01T00:00:00Z" }),
      ],
    });
    const entries = getReviewEntries(makeRecipe([flour]));
    expect(entries.map((e) => e.review.id)).toEqual(["rv-new", "rv-old"]);
  });

  it("感想がなければ空配列", () => {
    expect(getReviewEntries(makeRecipe([makeFlour()]))).toEqual([]);
  });
});

describe("getConfirmedBrandRecipes / getPossibleBrandRecipes", () => {
  const specified = makeBrandRecipe();
  const visual = makeBrandRecipe({ link_status: "visually_identified" });
  const unspecified = makeBrandRecipe({ link_status: "brand_unspecified" });
  const rows = [specified, visual, unspecified];

  it("「銘柄指定あり」「目視で確認可能」は作れるレシピとして返す", () => {
    expect(getConfirmedBrandRecipes(rows)).toEqual([specified, visual]);
  });

  it("「銘柄指定なし」（記載はないが作った実績がある）は作れるかも？レシピとして返す", () => {
    expect(getPossibleBrandRecipes(rows)).toEqual([unspecified]);
  });

  it("該当がなければどちらも空配列", () => {
    expect(getConfirmedBrandRecipes([unspecified])).toEqual([]);
    expect(getPossibleBrandRecipes([specified, visual])).toEqual([]);
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
