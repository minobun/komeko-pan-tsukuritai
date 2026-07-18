import { Suspense } from "react";
import { BrandFilters } from "@/components/brand-filters";
import { BrandList } from "@/components/brand-list";
import { JsonLd } from "@/components/json-ld";
import { getBrandReviewCounts, getFlourBrands } from "@/lib/data";
import { buildPageMetadata } from "@/lib/metadata";
import { buildItemListSchema } from "@/lib/structured-data";
import { formatBrandName } from "@/lib/types";

export const revalidate = 300;

export const metadata = buildPageMetadata({
  title: "米粉パン用の米粉銘柄一覧｜成分で比較",
  description:
    "米粉パン作りに使われる米粉銘柄の一覧。製パン用グルテンの有無・サイリウム配合の有無で絞り込めます。銘柄ごとに成分情報と、その米粉で作れるレシピの逆引き一覧を掲載しています。",
  path: "/brands",
});

export default async function BrandsPage() {
  const [brands, reviewCounts] = await Promise.all([
    getFlourBrands(),
    getBrandReviewCounts(),
  ]);

  return (
    <div>
      <JsonLd
        data={buildItemListSchema(
          "米粉銘柄一覧",
          brands.map((brand) => ({
            name: formatBrandName(brand),
            path: `/brands/${brand.id}`,
          })),
        )}
      />
      <h1 className="text-2xl font-bold text-stone-900">米粉銘柄一覧</h1>
      <p className="mt-2 text-sm text-stone-600">
        銘柄ごとの成分情報と、その銘柄で作れるレシピの逆引きを掲載しています。
      </p>
      <div className="mt-6">
        <Suspense
          fallback={<BrandList brands={brands} reviewCounts={reviewCounts} />}
        >
          <BrandFilters brands={brands} reviewCounts={reviewCounts} />
        </Suspense>
      </div>
    </div>
  );
}
