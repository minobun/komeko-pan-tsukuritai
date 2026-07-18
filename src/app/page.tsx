import Link from "next/link";
import { BrandCard } from "@/components/brand-card";
import { JsonLd } from "@/components/json-ld";
import { RecipeCard } from "@/components/recipe-card";
import { getFeaturedBrands, getLatestRecipes } from "@/lib/data";
import { buildWebSiteSchema } from "@/lib/structured-data";

// ISR: ビルド時＋5分ごと（または手動revalidate）にのみDBへアクセスする
export const revalidate = 300;

function SectionHeading({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-xl font-bold text-stone-900">{title}</h2>
      <Link
        href={href}
        className="text-sm font-medium text-amber-800 hover:underline"
      >
        {linkLabel} →
      </Link>
    </div>
  );
}

export default async function Home() {
  const [latestRecipes, featuredBrands] = await Promise.all([
    getLatestRecipes(6),
    getFeaturedBrands(4),
  ]);

  return (
    <div className="space-y-12">
      <JsonLd data={buildWebSiteSchema()} />
      {/* 文字色は背景 amber-900 に対し WCAG AA（4.5:1）以上を維持する（issue #63） */}
      <section className="rounded-xl bg-amber-900 px-6 py-10 text-white sm:px-10">
        <h1 className="text-2xl font-bold leading-snug sm:text-3xl">
          米粉パンのレシピを、
          <br className="sm:hidden" />
          「米粉の銘柄」から探せるサイト
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-amber-50 sm:text-base">
          米粉はメーカー・銘柄によって吸水率などの性質が異なり、同じレシピでも仕上がりが変わります。レシピで指定された銘柄が手に入らないこともあります。
          当サイトは、レシピと「実際に使われている米粉銘柄」の紐付けを運営者の独自調査（レシピ内の目視確認）でまとめています。
          家にある米粉から作れるレシピを逆引きすることもできます。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/recipes"
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
          >
            レシピを探す
          </Link>
          <Link
            href="/brands"
            className="rounded-full border border-amber-200 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
          >
            米粉銘柄から探す
          </Link>
        </div>
      </section>

      <section>
        <SectionHeading
          title="新着レシピ"
          href="/recipes"
          linkLabel="レシピをすべて見る"
        />
        {latestRecipes.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">
            レシピは準備中です。もうしばらくお待ちください。
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latestRecipes.map((recipe) => (
              <li key={recipe.id}>
                <RecipeCard recipe={recipe} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeading
          title="注目の米粉銘柄"
          href="/brands"
          linkLabel="銘柄をすべて見る"
        />
        {featuredBrands.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">
            銘柄情報は準備中です。もうしばらくお待ちください。
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {featuredBrands.map((brand) => (
              <li key={brand.id}>
                <BrandCard brand={brand} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
