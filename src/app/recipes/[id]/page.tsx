import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VerificationBadge } from "@/components/verification-badge";
import { getRecipeById, getRecipes } from "@/lib/data";
import { isGlutenFree } from "@/lib/types";

export const revalidate = 3600;

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const recipes = await getRecipes();
  return recipes.map((recipe) => ({ id: recipe.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  if (!recipe) return {};
  const brandNames = recipe.flours
    .flatMap((f) => (f.brand ? [f.brand.product_name] : []))
    .join("・");
  return {
    title: brandNames
      ? `${recipe.title}｜使用米粉: ${brandNames}`
      : recipe.title,
    description: `${recipe.site_name}掲載「${recipe.title}」（${recipe.author_name}さん）で使われている米粉銘柄と検証状況のまとめ。`,
  };
}

export default async function RecipeDetailPage({ params }: Props) {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  if (!recipe) notFound();

  return (
    <article>
      <nav className="text-xs text-stone-500" aria-label="パンくず">
        <Link href="/recipes" className="hover:text-amber-800">
          レシピ一覧
        </Link>
        <span className="mx-1">/</span>
        <span>{recipe.title}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
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
      </div>
      <h1 className="mt-2 text-2xl font-bold leading-snug text-stone-900">
        {recipe.title}
      </h1>
      <p className="mt-2 text-sm text-stone-600">
        掲載サイト：{recipe.site_name} ／ レシピ著作者：{recipe.author_name}さん
      </p>

      {recipe.memo && (
        <p className="mt-4 whitespace-pre-wrap rounded-lg bg-white p-4 text-sm leading-relaxed text-stone-700 shadow-sm">
          {recipe.memo}
        </p>
      )}

      <div className="mt-6">
        <a
          href={recipe.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-amber-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
        >
          {recipe.site_name}でレシピを見る ↗
        </a>
        <p className="mt-2 text-xs text-stone-500">
          レシピ本文（材料・手順）は外部サイトに掲載されています。
        </p>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-stone-900">使用されている米粉銘柄</h2>
        {recipe.flours.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">
            銘柄情報は現在調査中です。
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {recipe.flours.map((flour, index) => {
              const tags = flour.tags.flatMap((t) => (t.tag ? [t.tag] : []));
              return (
                <li
                  key={flour.brand?.id ?? index}
                  className="rounded-lg border border-amber-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {flour.brand ? (
                      <Link
                        href={`/brands/${flour.brand.id}`}
                        className="font-semibold text-amber-900 hover:underline"
                      >
                        {flour.brand.maker_name} {flour.brand.product_name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-stone-500">
                        銘柄情報なし
                      </span>
                    )}
                    <VerificationBadge status={flour.verification_status} />
                    {flour.brand?.is_discontinued && (
                      <span className="rounded-full border border-red-200 bg-white px-2 py-0.5 text-xs font-medium text-red-600">
                        廃番
                      </span>
                    )}
                  </div>
                  {flour.result_memo && (
                    <p className="mt-2 rounded bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      実食メモ：{flour.result_memo}
                    </p>
                  )}
                  {tags.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <li
                          key={tag.id}
                          className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600"
                        >
                          #{tag.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 text-xs text-stone-500">
          銘柄の紐付けは運営者による独自調査（実食確認または材料欄の目視確認）に基づきます。誤りのご指摘は
          <Link href="/about" className="text-amber-800 hover:underline">
            お問い合わせ窓口
          </Link>
          までお寄せください。
        </p>
      </section>
    </article>
  );
}
