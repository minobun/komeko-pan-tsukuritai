import Link from "next/link";
import {
  countReviews,
  hasBakedReview,
  isGlutenFree,
  type Recipe,
} from "@/lib/types";
import { BakedBadge } from "./baked-badge";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const brands = recipe.flours.flatMap((f) => (f.brand ? [f.brand] : []));
  const reviewCount = countReviews(recipe);

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="flex h-full flex-col rounded-lg border border-amber-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
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
        {/* 紐付けステータスは銘柄ごとの情報なので、一覧では実食の有無だけを示す */}
        {hasBakedReview(recipe) && <BakedBadge />}
        {/* 感想0件は薄色で「感想 0件」と表示し、件数があるものと見分けやすくする */}
        <span
          className={
            reviewCount > 0
              ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900"
              : "rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-400"
          }
        >
          感想 {reviewCount}件
        </span>
      </div>
      <h3 className="mt-2 font-semibold leading-snug text-stone-900">
        {recipe.title}
      </h3>
      <p className="mt-1 text-xs text-stone-500">
        {recipe.site_name} ／ {recipe.author_name}さん
      </p>
      {brands.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {brands.map((brand) => (
            <li
              key={brand.id}
              className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-900"
            >
              {brand.product_name}
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}
