import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Recipe, RecipeBrand, RecipeFlour, Review } from "@/lib/types";
import { RecipeCard } from "../recipe-card";

afterEach(cleanup);

function makeBrand(overrides: Partial<RecipeBrand> = {}): RecipeBrand {
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

function makeReview(): Review {
  return {
    id: "review-1",
    body: "おいしい",
    flour_tips: null,
    author_name: "運営者",
    author_type: "operator",
    created_at: "2026-01-01T00:00:00Z",
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
    bread_type: null,
    flours: [],
    specified_flours: [],
    ...overrides,
  };
}

describe("RecipeCard 表示する米粉（issue #109）", () => {
  it("レシピ本文に記載のある米粉を表示する", () => {
    const listed = makeBrand({ id: "listed", product_name: "記載の米粉" });
    render(
      <RecipeCard
        recipe={makeRecipe({
          specified_flours: [{ source: "text", brand: listed }],
        })}
      />,
    );
    expect(screen.getByText("記載の米粉")).toBeDefined();
  });

  it("運営者が独自に紐付けただけの米粉は表示しない", () => {
    const linkedOnly = makeBrand({ id: "linked", product_name: "紐付けだけ" });
    render(
      <RecipeCard
        recipe={makeRecipe({ flours: [makeFlour({ brand: linkedOnly })] })}
      />,
    );
    expect(screen.queryByText("紐付けだけ")).toBeNull();
  });
});

describe("RecipeCard バッジ（issue #104）", () => {
  it("レシピ本文への記載根拠をバッジで示す", () => {
    render(
      <RecipeCard
        recipe={makeRecipe({
          specified_flours: [{ source: "text", brand: makeBrand() }],
        })}
      />,
    );
    expect(screen.getByText("レシピに銘柄記載")).toBeDefined();
  });

  it("目視確認の根拠も区別して示す", () => {
    render(
      <RecipeCard
        recipe={makeRecipe({
          specified_flours: [{ source: "visual", brand: makeBrand() }],
        })}
      />,
    );
    expect(screen.getByText("写真から銘柄確認")).toBeDefined();
  });

  it("サイリウム・油を使わないレシピにそれぞれタグを出す", () => {
    render(
      <RecipeCard
        recipe={makeRecipe({ uses_psyllium: false, uses_oil: false })}
      />,
    );
    expect(screen.getByText("サイリウムなし")).toBeDefined();
    expect(screen.getByText("油なし")).toBeDefined();
  });

  it("使用有無が未確認の材料はタグを出さない", () => {
    render(<RecipeCard recipe={makeRecipe()} />);
    expect(screen.queryByText("サイリウムなし")).toBeNull();
    expect(screen.queryByText("油なし")).toBeNull();
  });

  it("使う材料にはタグを出さない", () => {
    render(
      <RecipeCard
        recipe={makeRecipe({ uses_psyllium: true, uses_oil: true })}
      />,
    );
    expect(screen.queryByText("サイリウムなし")).toBeNull();
    expect(screen.queryByText("油なし")).toBeNull();
  });

  it("感想はバッジではなくタイトル横に件数で示す", () => {
    render(
      <RecipeCard
        recipe={makeRecipe({
          flours: [makeFlour({ reviews: [makeReview(), makeReview()] })],
        })}
      />,
    );
    expect(screen.queryByText("感想 2件")).toBeNull();

    const heading = screen.getByRole("heading", { level: 3 });
    expect(within(heading).getByText(/💬/).textContent).toContain("2");
  });
});

describe("RecipeCard のリンク（issue #105）", () => {
  it("タイトルからレシピ詳細へ遷移できる", () => {
    render(<RecipeCard recipe={makeRecipe()} />);
    expect(
      screen.getByRole("link", { name: "テストレシピ" }).getAttribute("href"),
    ).toBe("/recipes/recipe-1");
  });

  it("表示している米粉から銘柄詳細へ遷移できる", () => {
    render(
      <RecipeCard
        recipe={makeRecipe({
          specified_flours: [
            { source: "text", brand: makeBrand({ id: "brand-9" }) },
          ],
        })}
      />,
    );
    expect(
      screen.getByRole("link", { name: "テスト米粉" }).getAttribute("href"),
    ).toBe("/brands/brand-9");
  });

  it("リンクが入れ子になっていない", () => {
    render(
      <RecipeCard
        recipe={makeRecipe({
          specified_flours: [{ source: "text", brand: makeBrand() }],
        })}
      />,
    );
    for (const link of screen.getAllByRole("link")) {
      expect(link.querySelector("a")).toBeNull();
    }
  });
});
