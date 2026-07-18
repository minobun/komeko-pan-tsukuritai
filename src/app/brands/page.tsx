import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandFilters } from "@/components/brand-filters";
import { BrandGrid } from "@/components/brand-grid";
import { getFlourBrands } from "@/lib/data";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "米粉銘柄一覧",
  description:
    "米粉パン作りに使われる米粉銘柄の一覧。グルテン入りかどうか・サイリウム配合の有無で絞り込めます。",
};

export default async function BrandsPage() {
  const brands = await getFlourBrands();

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">米粉銘柄一覧</h1>
      <p className="mt-2 text-sm text-stone-600">
        銘柄ごとの成分情報と、その銘柄で作れるレシピの逆引きを掲載しています。
      </p>
      <div className="mt-6">
        <Suspense fallback={<BrandGrid brands={brands} />}>
          <BrandFilters brands={brands} />
        </Suspense>
      </div>
    </div>
  );
}
