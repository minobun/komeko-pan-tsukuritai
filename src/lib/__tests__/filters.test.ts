import { describe, expect, it } from "vitest";
import {
  filterBrandRecipesByBreadType,
  filterBrands,
  filterRecipes,
  filterReviewEntriesByBrand,
  matchesTriState,
} from "@/lib/filters";
import type {
  BrandRecipe,
  FlourBrand,
  Recipe,
  RecipeFlour,
  ReviewEntry,
} from "@/lib/types";

function makeFlour(
  brand: Partial<NonNullable<RecipeFlour["brand"]>> = {},
): RecipeFlour {
  return {
    result_memo: null,
    brand: {
      id: "brand-1",
      maker: { id: "maker-1", name: "テスト製粉" },
      product_name: "テスト米粉",
      has_gluten: false,
      has_psyllium: false,
      is_discontinued: false,
      ...brand,
    },
    tags: [],
    reviews: [],
  };
}

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
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
    bread_type: { id: "bt-1", name: "食パン" },
    flours: [makeFlour()],
    specified_flours: [],
    ...overrides,
  };
}

function makeBrand(overrides: Partial<FlourBrand> = {}): FlourBrand {
  return {
    id: "brand-1",
    maker: { id: "maker-1", name: "テスト製粉" },
    product_name: "テスト米粉",
    is_bread_use: true,
    has_gluten: false,
    has_psyllium: false,
    origin: null,
    jan_code: null,
    official_url: null,
    image_url: null,
    purchase_url_amazon: null,
    purchase_url_rakuten: null,
    is_discontinued: false,
    note: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const noFilter = {
  brandId: "",
  breadType: "",
  glutenFreeOnly: false,
  psylliumFreeOnly: false,
  oilFreeOnly: false,
  specifiedOnly: false,
};

/** レシピ本文に記載された米粉（recipe_specified_flours）の1件を作る */
function makeSpecified(
  brandId: string,
  source: "text" | "visual" = "text",
): Recipe["specified_flours"][number] {
  return {
    source,
    brand: {
      id: brandId,
      maker: { id: "maker-1", name: "テスト製粉" },
      product_name: brandId,
      has_gluten: false,
      has_psyllium: false,
      is_discontinued: false,
    },
  };
}

describe("filterRecipes", () => {
  it("条件がすべて空なら全件返す", () => {
    const recipes = [makeRecipe(), makeRecipe({ id: "recipe-2" })];
    expect(filterRecipes(recipes, noFilter)).toEqual(recipes);
  });

  it("指定した銘柄がレシピ本文に記載されたレシピだけ残す", () => {
    const target = makeRecipe({
      id: "recipe-2",
      specified_flours: [makeSpecified("brand-9")],
    });
    const recipes = [makeRecipe(), target];
    expect(filterRecipes(recipes, { ...noFilter, brandId: "brand-9" })).toEqual(
      [target],
    );
  });

  it("紐付けだけで本文に記載のない銘柄では、その銘柄フィルタに一致しない（#109）", () => {
    // カードは記載のある米粉しか出さないので、絞り込みも記載ベースに揃える
    const linkedOnly = makeRecipe({
      flours: [makeFlour({ id: "brand-9" })],
      specified_flours: [],
    });
    expect(
      filterRecipes([linkedOnly], { ...noFilter, brandId: "brand-9" }),
    ).toEqual([]);
  });

  it("銘柄特定済みのみ指定で、本文に銘柄の記載があるレシピだけ残す", () => {
    const specified = makeRecipe({
      id: "recipe-2",
      specified_flours: [makeSpecified("brand-1")],
    });
    const notSpecified = makeRecipe({ id: "recipe-3", specified_flours: [] });
    expect(
      filterRecipes([specified, notSpecified], {
        ...noFilter,
        specifiedOnly: true,
      }),
    ).toEqual([specified]);
  });

  it("油なし指定でuses_oilがfalseのレシピだけ残す（未確認は含めない）", () => {
    const without = makeRecipe({ id: "recipe-2", uses_oil: false });
    const withOil = makeRecipe({ id: "recipe-3", uses_oil: true });
    const unknown = makeRecipe(); // uses_oil: null（未確認）
    expect(
      filterRecipes([without, withOil, unknown], {
        ...noFilter,
        oilFreeOnly: true,
      }),
    ).toEqual([without]);
  });

  it("パン種別名で絞り込める（bread_typeがnullのレシピは除外）", () => {
    const shokupan = makeRecipe();
    const rounds = [
      makeRecipe({ id: "recipe-2", bread_type: { id: "bt-2", name: "丸パン" } }),
      makeRecipe({ id: "recipe-3", bread_type: null }),
    ];
    expect(
      filterRecipes([shokupan, ...rounds], { ...noFilter, breadType: "食パン" }),
    ).toEqual([shokupan]);
  });

  it("グルテンフリーのみ指定でグルテン入りレシピを除外する", () => {
    const glutenFree = makeRecipe();
    const withGluten = makeRecipe({
      id: "recipe-2",
      flours: [makeFlour({ has_gluten: true })],
    });
    expect(
      filterRecipes([glutenFree, withGluten], {
        ...noFilter,
        glutenFreeOnly: true,
      }),
    ).toEqual([glutenFree]);
  });

  it("サイリウムなし指定でuses_psylliumがfalseのレシピだけ残す", () => {
    const without = makeRecipe({ id: "recipe-2", uses_psyllium: false });
    const withPsyllium = makeRecipe({ id: "recipe-3", uses_psyllium: true });
    const unknown = makeRecipe(); // uses_psyllium: null（未確認）は含めない
    expect(
      filterRecipes([without, withPsyllium, unknown], {
        ...noFilter,
        psylliumFreeOnly: true,
      }),
    ).toEqual([without]);
  });

  it("複数条件はAND（すべて満たすレシピのみ残る）", () => {
    const match = makeRecipe({
      id: "recipe-2",
      specified_flours: [makeSpecified("brand-9")],
    });
    const breadTypeMismatch = makeRecipe({
      id: "recipe-3",
      bread_type: { id: "bt-2", name: "丸パン" },
      specified_flours: [makeSpecified("brand-9")],
    });
    expect(
      filterRecipes([match, breadTypeMismatch, makeRecipe()], {
        ...noFilter,
        brandId: "brand-9",
        breadType: "食パン",
        glutenFreeOnly: true,
      }),
    ).toEqual([match]);
  });
});

describe("matchesTriState", () => {
  it("空文字（すべて）は値によらずtrue", () => {
    expect(matchesTriState("", true)).toBe(true);
    expect(matchesTriState("", false)).toBe(true);
  });

  it("withは値がtrueのときだけtrue", () => {
    expect(matchesTriState("with", true)).toBe(true);
    expect(matchesTriState("with", false)).toBe(false);
  });

  it("withoutは値がfalseのときだけtrue", () => {
    expect(matchesTriState("without", false)).toBe(true);
    expect(matchesTriState("without", true)).toBe(false);
  });
});

describe("filterReviewEntriesByBrand", () => {
  const review = {
    id: "rv-1",
    body: "もちもちに焼けた",
    flour_tips: null,
    author_name: "運営者",
    author_type: "operator",
    created_at: "2026-01-01T00:00:00Z",
  } as const;
  const brand = (id: string) => ({
    id,
    maker: { id: "maker-1", name: "テスト製粉" },
    product_name: "テスト米粉",
    has_gluten: false,
    has_psyllium: false,
    is_discontinued: false,
  });
  const entries: ReviewEntry[] = [
    { review: { ...review, id: "rv-1" }, brand: brand("brand-1") },
    { review: { ...review, id: "rv-2" }, brand: brand("brand-2") },
    { review: { ...review, id: "rv-3" }, brand: null },
  ];

  it("空文字（すべて）なら全件返す", () => {
    expect(filterReviewEntriesByBrand(entries, "")).toEqual(entries);
  });

  it("銘柄IDが一致する感想だけ残す（brandがnullの感想は除外）", () => {
    expect(
      filterReviewEntriesByBrand(entries, "brand-1").map((e) => e.review.id),
    ).toEqual(["rv-1"]);
  });
});

describe("filterBrandRecipesByBreadType", () => {
  const makeRow = (
    id: string,
    breadType: { id: string; name: string } | null,
  ): BrandRecipe => ({
    specified_source: "text",
    result_memo: null,
    reviews: [],
    recipe: {
      id,
      title: "テストレシピ",
      site_name: "テストサイト",
      author_name: "テスト太郎",
      status: "published",
      created_at: "2026-01-01T00:00:00Z",
      bread_type: breadType,
    },
  });
  const shokupan = makeRow("r-1", { id: "bt-1", name: "食パン" });
  const round = makeRow("r-2", { id: "bt-2", name: "丸パン" });
  const noType = makeRow("r-3", null);
  const rows = [shokupan, round, noType];

  it("空文字（すべて）なら全件返す", () => {
    expect(filterBrandRecipesByBreadType(rows, "")).toEqual(rows);
  });

  it("パン種別名が一致するレシピだけ残す（bread_typeがnullの行は除外）", () => {
    expect(filterBrandRecipesByBreadType(rows, "食パン")).toEqual([shokupan]);
  });
});

describe("filterBrands", () => {
  const glutenFree = makeBrand();
  const withGluten = makeBrand({ id: "brand-2", has_gluten: true });
  const withPsyllium = makeBrand({ id: "brand-3", has_psyllium: true });
  const brands = [glutenFree, withGluten, withPsyllium];

  const noBrandFilter = { gluten: "", psyllium: "", maker: "" } as const;

  it("条件がすべて空なら全件返す", () => {
    expect(filterBrands(brands, noBrandFilter)).toEqual(brands);
  });

  it("グルテンフリー（without）で絞り込める", () => {
    expect(
      filterBrands(brands, { ...noBrandFilter, gluten: "without" }),
    ).toEqual([glutenFree, withPsyllium]);
  });

  it("グルテンとサイリウムの条件はAND", () => {
    expect(
      filterBrands(brands, {
        ...noBrandFilter,
        gluten: "without",
        psyllium: "with",
      }),
    ).toEqual([withPsyllium]);
  });

  it("メーカー名で絞り込める（issue #107）", () => {
    const nami = makeBrand({
      id: "brand-9",
      maker: { id: "maker-2", name: "波里" },
    });
    expect(
      filterBrands([...brands, nami], { ...noBrandFilter, maker: "波里" }),
    ).toEqual([nami]);
  });

  it("makerがnullの銘柄はメーカー指定時に除外され、エラーにならない", () => {
    const noMaker = makeBrand({ id: "brand-9", maker: null });
    expect(
      filterBrands([...brands, noMaker], { ...noBrandFilter, maker: "波里" }),
    ).toEqual([]);
  });
});
