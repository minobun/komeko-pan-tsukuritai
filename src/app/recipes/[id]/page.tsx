import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BakedBadge } from "@/components/baked-badge";
import { IngredientUsageList } from "@/components/ingredient-usage-list";
import { JsonLd } from "@/components/json-ld";
import { RecipeReviewList } from "@/components/recipe-review-list";
import { SpecifiedFlourBadge } from "@/components/specified-flour-badge";
import { getRecipeById, getRecipes } from "@/lib/data";
import { buildPageMetadata } from "@/lib/metadata";
import {
  buildBreadcrumbSchema,
  buildRecipeBrandListSchema,
} from "@/lib/structured-data";
import {
  formatBrandName,
  getListedFlours,
  getRecipeIngredientUsages,
  getReviewEntries,
  hasBakedReview,
  isGlutenFree,
} from "@/lib/types";

export const revalidate = 300;

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const recipes = await getRecipes();
  return recipes.map((recipe) => ({ id: recipe.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  if (!recipe) {
    return { title: "レシピが見つかりません", robots: { index: false } };
  }

  // 「使用米粉」と名乗れるのはレシピ自身が記載している銘柄だけ。独自に紐付けた
  //  銘柄（作れるかも？）はレシピが使っているとは限らないので含めない（issue #94）
  const brandNames = getListedFlours(recipe)
    .flatMap((f) => (f.brand ? [f.brand.product_name] : []))
    .join("・");
  const breadType = recipe.bread_type?.name;
  const hasBaked = hasBakedReview(recipe);

  return buildPageMetadata({
    title: brandNames
      ? `${recipe.title}｜使用米粉: ${brandNames}`
      : recipe.title,
    description: [
      `${recipe.site_name}掲載の${breadType ?? "米粉パン"}レシピ「${recipe.title}」（${recipe.author_name}さん）で使われている米粉銘柄`,
      brandNames && `（${brandNames}）`,
      "と検証状況のまとめ。",
      hasBaked && "運営者が実際に焼いて確認した実食メモつき。",
    ]
      .filter(Boolean)
      .join(""),
    path: `/recipes/${recipe.id}`,
    type: "article",
  });
}

export default async function RecipeDetailPage({ params }: Props) {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  if (!recipe) notFound();

  const listedFlours = getListedFlours(recipe);
  const reviewEntries = getReviewEntries(recipe);

  return (
    <article>
      <JsonLd data={buildRecipeBrandListSchema(recipe)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "ホーム", path: "/" },
          { name: "レシピ一覧", path: "/recipes" },
          { name: recipe.title, path: `/recipes/${recipe.id}` },
        ])}
      />
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
        <section className="mt-4 rounded-lg bg-white p-4 shadow-sm">
          {/* 誰の発言か分かるよう「運営者のコメント」であることを明示する（issue #66） */}
          <h2 className="text-sm font-bold text-stone-900">運営者のコメント</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
            {recipe.memo}
          </p>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-bold text-stone-900">
          サイリウム・グルテン・油の使用
        </h2>
        <IngredientUsageList usages={getRecipeIngredientUsages(recipe)} />
        <p className="mt-2 text-xs text-stone-500">
          「未確認」はレシピの材料欄を未調査の項目です。
        </p>
      </section>

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

      {/* レシピに記載のある米粉と、作った感想は性質が異なる情報なので
          別セクションに分けて表示する（issue #66） */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-stone-900">
          レシピに記載のある米粉
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          レシピ本文に銘柄の指定があるもの、または写真・動画から銘柄を目視で確認できたものです。
        </p>
        {listedFlours.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">
            レシピに記載のある銘柄は確認できていません（調査中の場合があります）。
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {listedFlours.map((flour, index) => {
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
                        {formatBrandName(flour.brand)}
                      </Link>
                    ) : (
                      <span className="font-semibold text-stone-500">
                        銘柄情報なし
                      </span>
                    )}
                    <SpecifiedFlourBadge source={flour.source} />
                    {flour.reviews.length > 0 && <BakedBadge />}
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
          銘柄の紐付けは運営者による独自調査（レシピ内の目視確認）に基づきます。誤りのご指摘は
          <Link href="/about" className="text-amber-800 hover:underline">
            お問い合わせ窓口
          </Link>
          までお寄せください。
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-stone-900">
          このレシピで作った感想
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          レシピに記載のない米粉で作った感想も含みます。
        </p>
        <RecipeReviewList entries={reviewEntries} />
      </section>
    </article>
  );
}
