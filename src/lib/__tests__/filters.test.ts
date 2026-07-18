import { describe, expect, it } from "vitest";
import {
  filterBrands,
  filterRecipes,
  matchesTriState,
} from "@/lib/filters";
import type { FlourBrand, Recipe, RecipeFlour } from "@/lib/types";

function makeFlour(
  brand: Partial<NonNullable<RecipeFlour["brand"]>> = {},
): RecipeFlour {
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
    ...overrides,
  };
}

function makeBrand(overrides: Partial<FlourBrand> = {}): FlourBrand {
  return {
    id: "brand-1",
    maker_name: "テスト製粉",
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

const noFilter = { maker: "", breadType: "", glutenFreeOnly: false };

describe("filterRecipes", () => {
  it("条件がすべて空なら全件返す", () => {
    const recipes = [makeRecipe(), makeRecipe({ id: "recipe-2" })];
    expect(filterRecipes(recipes, noFilter)).toEqual(recipes);
  });

  it("メーカー名が一致する銘柄を使うレシピだけ残す", () => {
    const target = makeRecipe({
      id: "recipe-2",
      flours: [makeFlour({ maker_name: "波里" })],
    });
    const recipes = [makeRecipe(), target];
    expect(filterRecipes(recipes, { ...noFilter, maker: "波里" })).toEqual([
      target,
    ]);
  });

  it("brandがnullの行はメーカー判定でエラーにならず除外される", () => {
    const recipe = makeRecipe({
      flours: [
        {
          verification_status: "baked",
          result_memo: null,
          brand: null,
          tags: [],
          reviews: [],
        },
      ],
    });
    expect(filterRecipes([recipe], { ...noFilter, maker: "波里" })).toEqual([]);
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

  it("複数条件はAND（すべて満たすレシピのみ残る）", () => {
    const match = makeRecipe({
      id: "recipe-2",
      flours: [makeFlour({ maker_name: "波里" })],
    });
    const makerOnly = makeRecipe({
      id: "recipe-3",
      bread_type: { id: "bt-2", name: "丸パン" },
      flours: [makeFlour({ maker_name: "波里" })],
    });
    expect(
      filterRecipes([match, makerOnly, makeRecipe()], {
        maker: "波里",
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

describe("filterBrands", () => {
  const glutenFree = makeBrand();
  const withGluten = makeBrand({ id: "brand-2", has_gluten: true });
  const withPsyllium = makeBrand({ id: "brand-3", has_psyllium: true });
  const brands = [glutenFree, withGluten, withPsyllium];

  it("条件がすべて空なら全件返す", () => {
    expect(filterBrands(brands, { gluten: "", psyllium: "" })).toEqual(brands);
  });

  it("グルテンフリー（without）で絞り込める", () => {
    expect(filterBrands(brands, { gluten: "without", psyllium: "" })).toEqual([
      glutenFree,
      withPsyllium,
    ]);
  });

  it("グルテンとサイリウムの条件はAND", () => {
    expect(
      filterBrands(brands, { gluten: "without", psyllium: "with" }),
    ).toEqual([withPsyllium]);
  });
});
