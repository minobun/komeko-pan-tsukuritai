import type { Recipe } from "@/lib/types";
import { RecipeCard } from "./recipe-card";

export function RecipeGrid({ recipes }: { recipes: Recipe[] }) {
  if (recipes.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-stone-300 bg-white px-4 py-8 text-center text-sm text-stone-500">
        条件に合うレシピが見つかりませんでした。
      </p>
    );
  }
  // タイル形式だと項目を上下に見比べられないため、縦1列のリスト形式で並べる（issue #64）
  return (
    <ul className="flex flex-col gap-3">
      {recipes.map((recipe) => (
        <li key={recipe.id}>
          <RecipeCard recipe={recipe} />
        </li>
      ))}
    </ul>
  );
}
