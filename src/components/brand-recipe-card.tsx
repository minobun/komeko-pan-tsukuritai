import Link from "next/link";
import type { BrandRecipe } from "@/lib/types";
import { BakedBadge } from "./baked-badge";
import { LinkStatusBadge } from "./link-status-badge";

/**
 * 銘柄詳細の逆引きレシピ1件。「銘柄指定なし」（レシピに記載はないが作った実績がある）
 * の行は「作れるかも？」バッジで通常の紐付けと区別する（issue #67）。
 */
export function BrandRecipeCard({ row }: { row: BrandRecipe }) {
  const { recipe, link_status, result_memo, reviews } = row;
  if (!recipe) return null;
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="block rounded-lg border border-amber-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {recipe.bread_type && (
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
            {recipe.bread_type.name}
          </span>
        )}
        {link_status === "brand_unspecified" ? (
          <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
            作れるかも？
          </span>
        ) : (
          <LinkStatusBadge status={link_status} />
        )}
        {reviews.length > 0 && <BakedBadge />}
      </div>
      <h3 className="mt-2 font-semibold leading-snug text-stone-900">
        {recipe.title}
      </h3>
      <p className="mt-1 text-xs text-stone-500">
        {recipe.site_name} ／ {recipe.author_name}さん
      </p>
      {result_memo && (
        <p className="mt-2 rounded bg-amber-50 px-3 py-2 text-sm text-amber-900">
          実食メモ：{result_memo}
        </p>
      )}
    </Link>
  );
}
