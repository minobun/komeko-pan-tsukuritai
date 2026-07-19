import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/metadata";
import { notFound } from "next/navigation";
import { BrandChips } from "@/components/brand-card";
import { BrandImage } from "@/components/brand-image";
import { BrandRecipeCard } from "@/components/brand-recipe-card";
import { BrandRecipeList } from "@/components/brand-recipe-list";
import { JsonLd } from "@/components/json-ld";
import {
  buildBrandProductSchema,
  buildBreadcrumbSchema,
} from "@/lib/structured-data";
import {
  getFlourBrandById,
  getFlourBrands,
  getRecipesByBrandId,
} from "@/lib/data";
import {
  formatBrandName,
  getConfirmedBrandRecipes,
  getMakerName,
  getPossibleBrandRecipes,
} from "@/lib/types";

export const revalidate = 300;

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const brands = await getFlourBrands();
  return brands.map((brand) => ({ id: brand.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [brand, brandRecipes] = await Promise.all([
    getFlourBrandById(id),
    getRecipesByBrandId(id),
  ]);
  if (!brand) return { title: "銘柄が見つかりません", robots: { index: false } };

  const name = formatBrandName(brand);
  // 件数・パン種別は「作れるレシピ」（レシピ側に根拠がある紐付け）だけで数える
  const confirmed = getConfirmedBrandRecipes(brandRecipes);
  // 「銘柄名×パン種別」での検索流入を狙い、逆引きレシピのパン種別をtitleに含める
  const breadTypes = Array.from(
    new Set(
      confirmed.flatMap((r) =>
        r.recipe?.bread_type ? [r.recipe.bread_type.name] : [],
      ),
    ),
  );
  const breadTypeLabel = breadTypes.slice(0, 3).join("・");

  return buildPageMetadata({
    title: breadTypeLabel
      ? `${name}で作る米粉パン（${breadTypeLabel}）｜成分とレシピ${confirmed.length}件`
      : `${name}｜成分と作れる米粉パンレシピ`,
    description:
      brand.note?.slice(0, 120) ??
      `${name}の成分情報（製パン用グルテン・サイリウムの有無）と、この米粉で作れる米粉パンレシピ${confirmed.length}件の逆引き一覧。`,
    path: `/brands/${brand.id}`,
    type: "article",
  });
}

export default async function BrandDetailPage({ params }: Props) {
  const { id } = await params;
  const [brand, brandRecipes] = await Promise.all([
    getFlourBrandById(id),
    getRecipesByBrandId(id),
  ]);
  if (!brand) notFound();

  const confirmedRecipes = getConfirmedBrandRecipes(brandRecipes);
  const possibleRecipes = getPossibleBrandRecipes(brandRecipes);

  return (
    <article>
      <JsonLd data={buildBrandProductSchema(brand, brandRecipes)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "ホーム", path: "/" },
          { name: "米粉銘柄一覧", path: "/brands" },
          { name: brand.product_name, path: `/brands/${brand.id}` },
        ])}
      />
      <nav className="text-xs text-stone-500" aria-label="パンくず">
        <Link href="/brands" className="hover:text-amber-800">
          米粉銘柄一覧
        </Link>
        <span className="mx-1">/</span>
        <span>{brand.product_name}</span>
      </nav>

      <div className="mt-4 grid gap-6 sm:grid-cols-[200px_1fr]">
        <BrandImage
          brand={brand}
          className="h-48 w-full rounded-lg border border-stone-200 sm:h-52"
        />
        <div>
          <p className="text-sm text-stone-500">{getMakerName(brand)}</p>
          <h1 className="mt-1 text-2xl font-bold text-stone-900">
            {brand.product_name}
          </h1>
          <div className="mt-3">
            <BrandChips brand={brand} />
          </div>
          {brand.is_discontinued && (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              この銘柄は廃番（または販売終了）と思われます。店頭在庫や後継品をご確認ください。
            </p>
          )}
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {brand.origin && (
              <>
                <dt className="text-stone-500">原材料米の産地</dt>
                <dd className="text-stone-800">{brand.origin}</dd>
              </>
            )}
            {brand.jan_code && (
              <>
                <dt className="text-stone-500">JANコード</dt>
                <dd className="text-stone-800">{brand.jan_code}</dd>
              </>
            )}
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            {brand.official_url && (
              <a
                href={brand.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-stone-300 bg-white px-4 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
              >
                メーカー公式ページ
              </a>
            )}
            {brand.purchase_url_amazon && (
              <a
                href={brand.purchase_url_amazon}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="rounded-full bg-amber-700 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
              >
                Amazonで見る
              </a>
            )}
            {brand.purchase_url_rakuten && (
              <a
                href={brand.purchase_url_rakuten}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="rounded-full bg-red-700 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-800"
              >
                楽天で見る
              </a>
            )}
          </div>
        </div>
      </div>

      {brand.note && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-stone-900">銘柄について</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
            {brand.note}
          </p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-bold text-stone-900">
          {brand.product_name}で作れるレシピ（{confirmedRecipes.length}件）
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          レシピ本文に銘柄の指定があるもの、または写真・動画から銘柄を目視で確認できたものです。
        </p>
        <BrandRecipeList rows={confirmedRecipes} />
      </section>

      {/* レシピ本文に記載のない銘柄でも、この米粉で作れるとして独自に紐付けたものは
          「作れるかも？」としてレシピ公式の銘柄と区別して紹介する（issue #67 / #94）。
          0件の場合はセクションごと表示しない */}
      {possibleRecipes.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-stone-900">
            作れるかも？なレシピ（{possibleRecipes.length}件）
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            レシピに{brand.product_name}
            の記載はありませんが、この米粉でも作れると考えて運営者が紐付けたレシピです。
          </p>
          <ul className="mt-4 space-y-3">
            {possibleRecipes.map((row) => (
              <li key={row.recipe!.id}>
                <BrandRecipeCard row={row} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
