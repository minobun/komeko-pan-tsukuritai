import {
  compareBrandsByName,
  countReviews,
  formatBrandName,
  getConfirmedBrandRecipes,
  getListedFlours,
  getMakerName,
  getPossibleBrandRecipes,
  getRecipeBrands,
  getRecipeIngredientUsages,
  getReviewEntries,
  hasBakedReview,
  isGlutenFree,
  mergeBrandRecipes,
  type BrandRecipe,
  type Recipe,
  type RecipeFlour,
  type Review,
  type SpecifiedFlour,
} from "@/lib/types";
import { describe, expect, it } from "vitest";
import { getGlossaryTerm } from "@/lib/glossary";

function makeBrandRecipe(overrides: Partial<BrandRecipe> = {}): BrandRecipe {
  return {
    specified_source: "text",
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

function makeBrand(overrides: Partial<RecipeFlour["brand"]> = {}) {
  return {
    id: "brand-1",
    maker: { id: "maker-1", name: "テスト製粉" },
    product_name: "テスト米粉",
    has_gluten: false,
    has_psyllium: false,
    is_discontinued: false,
    ...overrides,
  };
}

function makeFlour(overrides: Partial<RecipeFlour> = {}): RecipeFlour {
  return {
    result_memo: null,
    brand: makeBrand(),
    tags: [],
    reviews: [],
    ...overrides,
  };
}

/** レシピ本文に記載された米粉（recipe_specified_flours） */
function makeSpecified(
  overrides: Partial<SpecifiedFlour> = {},
): SpecifiedFlour {
  return { source: "text", brand: makeBrand(), ...overrides };
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
    specified_flours: [],
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

  it("感想が1件もなければfalse（紐付けの有無は実食の根拠にしない）", () => {
    const recipe = makeRecipe([makeFlour(), makeFlour()], {
      specified_flours: [makeSpecified()],
    });
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
  it("レシピ記載の米粉（recipe_specified_flours）だけを記載根拠つきで返す", () => {
    const recipe = makeRecipe([], {
      specified_flours: [
        makeSpecified(),
        makeSpecified({
          source: "visual",
          brand: makeBrand({ id: "brand-2", product_name: "別の米粉" }),
        }),
      ],
    });
    expect(getListedFlours(recipe).map((f) => [f.brand?.id, f.source])).toEqual([
      ["brand-1", "text"],
      ["brand-2", "visual"],
    ]);
  });

  it("同じ銘柄の紐付けがあれば、その感想・メモ・タグを重ねて返す", () => {
    const review = makeReview();
    const tag = { tag: { id: "tag-1", name: "もちもち" } };
    const recipe = makeRecipe(
      [makeFlour({ result_memo: "よく膨らんだ", tags: [tag], reviews: [review] })],
      { specified_flours: [makeSpecified()] },
    );
    expect(getListedFlours(recipe)).toEqual([
      {
        source: "text",
        brand: makeBrand(),
        result_memo: "よく膨らんだ",
        tags: [tag],
        reviews: [review],
      },
    ]);
  });

  it("記載銘柄に紐付けがなければ感想・タグは空、メモはnullになる", () => {
    const recipe = makeRecipe([], { specified_flours: [makeSpecified()] });
    expect(getListedFlours(recipe)).toEqual([
      {
        source: "text",
        brand: makeBrand(),
        result_memo: null,
        tags: [],
        reviews: [],
      },
    ]);
  });

  it("紐付けだけの米粉（記載なし）は含めない", () => {
    const recipe = makeRecipe([makeFlour()]);
    expect(getListedFlours(recipe)).toEqual([]);
  });

  it("銘柄が取得できていない記載行があっても、紐付けを誤って結合しない", () => {
    const recipe = makeRecipe([makeFlour({ reviews: [makeReview()] })], {
      specified_flours: [makeSpecified({ brand: null })],
    });
    expect(getListedFlours(recipe)).toEqual([
      {
        source: "text",
        brand: null,
        result_memo: null,
        tags: [],
        reviews: [],
      },
    ]);
  });
});

describe("getRecipeBrands", () => {
  it("記載の銘柄と紐付けの銘柄を重複なく返す", () => {
    const other = makeBrand({ id: "brand-2", product_name: "別の米粉" });
    const recipe = makeRecipe([makeFlour(), makeFlour({ brand: other })], {
      specified_flours: [makeSpecified()],
    });
    expect(getRecipeBrands(recipe).map((b) => b.id)).toEqual([
      "brand-1",
      "brand-2",
    ]);
  });

  it("銘柄が取得できていない行は除外する", () => {
    const recipe = makeRecipe([makeFlour({ brand: null })], {
      specified_flours: [makeSpecified({ brand: null })],
    });
    expect(getRecipeBrands(recipe)).toEqual([]);
  });
});

describe("getReviewEntries", () => {
  it("全銘柄の感想を銘柄情報つきでフラットに返す（レシピ記載外の銘柄の感想も含む）", () => {
    const specified = makeFlour({
      reviews: [makeReview({ id: "rv-1", created_at: "2026-01-01T00:00:00Z" })],
    });
    const unlisted = makeFlour({
      brand: makeBrand({ id: "brand-2", product_name: "別の米粉" }),
      reviews: [makeReview({ id: "rv-2", created_at: "2026-02-01T00:00:00Z" })],
    });
    const entries = getReviewEntries(
      makeRecipe([specified, unlisted], {
        specified_flours: [makeSpecified()],
      }),
    );
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
  const visual = makeBrandRecipe({ specified_source: "visual" });
  const unlisted = makeBrandRecipe({ specified_source: null });
  const rows = [specified, visual, unlisted];

  it("レシピに記載のある銘柄（本文指定・目視確認）は作れるレシピとして返す", () => {
    expect(getConfirmedBrandRecipes(rows)).toEqual([specified, visual]);
  });

  it("記載はないが紐付けがあるものは作れるかも？レシピとして返す", () => {
    expect(getPossibleBrandRecipes(rows)).toEqual([unlisted]);
  });

  it("該当がなければどちらも空配列", () => {
    expect(getConfirmedBrandRecipes([unlisted])).toEqual([]);
    expect(getPossibleBrandRecipes([specified, visual])).toEqual([]);
  });
});

describe("mergeBrandRecipes（逆引きの 4.4 と 4.5 の和集合）", () => {
  const recipeOf = (id: string, created_at = "2026-01-01T00:00:00Z") => ({
    id,
    title: `レシピ${id}`,
    site_name: "テストサイト",
    author_name: "テスト太郎",
    status: "published",
    created_at,
    bread_type: null,
  });

  it("同じレシピの紐付けと記載行を1行にまとめる", () => {
    const review = makeReview();
    const rows = mergeBrandRecipes(
      [{ result_memo: "メモ", reviews: [review], recipe: recipeOf("r-1") }],
      [{ source: "text", recipe: recipeOf("r-1") }],
    );
    expect(rows).toEqual([
      {
        specified_source: "text",
        result_memo: "メモ",
        reviews: [review],
        recipe: recipeOf("r-1"),
      },
    ]);
  });

  it("記載のみ（紐付けなし）のレシピも逆引きに含める", () => {
    const rows = mergeBrandRecipes([], [
      { source: "visual", recipe: recipeOf("r-1") },
    ]);
    expect(rows).toEqual([
      {
        specified_source: "visual",
        result_memo: null,
        reviews: [],
        recipe: recipeOf("r-1"),
      },
    ]);
  });

  it("紐付けのみ（記載なし）は specified_source が null になる", () => {
    const rows = mergeBrandRecipes(
      [{ result_memo: null, reviews: [], recipe: recipeOf("r-1") }],
      [],
    );
    expect(rows[0].specified_source).toBeNull();
  });

  it("公開中でないレシピとレシピ欠損行は除外する", () => {
    const draft = { ...recipeOf("r-draft"), status: "draft" };
    const rows = mergeBrandRecipes(
      [
        { result_memo: null, reviews: [], recipe: draft },
        { result_memo: null, reviews: [], recipe: null },
      ],
      [{ source: "text", recipe: draft }],
    );
    expect(rows).toEqual([]);
  });

  it("新しいレシピ順に並べる", () => {
    const rows = mergeBrandRecipes(
      [
        {
          result_memo: null,
          reviews: [],
          recipe: recipeOf("r-old", "2026-01-01T00:00:00Z"),
        },
      ],
      [{ source: "text", recipe: recipeOf("r-new", "2026-06-01T00:00:00Z") }],
    );
    expect(rows.map((r) => r.recipe?.id)).toEqual(["r-new", "r-old"]);
  });
});

describe("getRecipeIngredientUsages", () => {
  it("サイリウム・グルテン・油をこの順で返す", () => {
    const usages = getRecipeIngredientUsages(makeRecipe([]));
    expect(usages.map((u) => u.label)).toEqual(["サイリウム", "グルテン", "油"]);
  });

  it("材料名は用語集の見出し語をそのまま使う（issue #101）", () => {
    const usages = getRecipeIngredientUsages(makeRecipe([]));
    expect(usages.map((u) => u.glossaryId)).toEqual([
      "psyllium",
      "gluten",
      "oil",
    ]);
    for (const usage of usages) {
      expect(usage.label).toBe(getGlossaryTerm(usage.glossaryId).term);
    }
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
