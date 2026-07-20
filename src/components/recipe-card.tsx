import Link from "next/link";
import {
  countReviews,
  getRecipeIngredientUsages,
  getSpecifiedBrands,
  getSpecifiedSources,
  hasBakedReview,
  isGlutenFree,
  type Recipe,
} from "@/lib/types";
import { BakedBadge } from "./baked-badge";
import { SpecifiedFlourBadge } from "./specified-flour-badge";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  // レシピ本文に記載のある米粉だけを出す。運営者が独自に紐付けた「作れるかも」の
  // 米粉はレシピが指定したものではないため、一覧には混ぜない（issue #109）
  const brands = getSpecifiedBrands(recipe);
  const reviewCount = countReviews(recipe);
  // グルテンは銘柄側の成分で判定する「グルテンフリー」バッジと紛らわしいので、
  // 材料タグとしてはサイリウム・油だけを出す（issue #104）
  const freeIngredients = getRecipeIngredientUsages(recipe).filter(
    (ingredient) =>
      ingredient.usage === "unused" && ingredient.key !== "uses_gluten",
  );

  return (
    // カード全体をクリック可能にしつつ銘柄リンクも置けるよう、タイトルのリンクを
    // 疑似要素でカードいっぱいに広げる。リンクの入れ子は作らない（issue #105）
    <div className="relative flex h-full flex-col rounded-lg border border-amber-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-center gap-1.5">
        {recipe.bread_type && (
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
            {recipe.bread_type.name}
          </span>
        )}
        {isGlutenFree(recipe) && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
            グルテンフリー
          </span>
        )}
        {freeIngredients.map((ingredient) => (
          <span
            key={ingredient.key}
            className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
          >
            {ingredient.label}なし
          </span>
        ))}
        {/* レシピ本文に銘柄の記載があるかは検証レベルの明示なので一覧にも出す（spec §2） */}
        {getSpecifiedSources(recipe).map((source) => (
          <SpecifiedFlourBadge key={source} source={source} />
        ))}
        {hasBakedReview(recipe) && <BakedBadge />}
      </div>
      <h3 className="mt-2 flex flex-wrap items-baseline gap-x-2 font-semibold leading-snug text-stone-900">
        <Link
          href={`/recipes/${recipe.id}`}
          className="after:absolute after:inset-0 after:content-['']"
        >
          {recipe.title}
        </Link>
        <span className="text-xs font-medium text-stone-500">
          💬 {reviewCount}
        </span>
      </h3>
      <p className="mt-1 text-xs text-stone-500">
        {recipe.site_name} ／ {recipe.author_name}さん
      </p>
      {brands.length > 0 && (
        // カード全体を覆うタイトルリンクより手前に出さないとタップできない。
        // タップ領域が近接するため、余白を広めに取って誤タップを防ぐ
        <ul className="relative z-10 mt-3 flex flex-wrap gap-2">
          {brands.map((brand) => (
            <li key={brand.id}>
              <Link
                href={`/brands/${brand.id}`}
                className="inline-block rounded bg-amber-50 px-2 py-1 text-xs text-amber-900 hover:bg-amber-100 hover:underline"
              >
                {brand.product_name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
