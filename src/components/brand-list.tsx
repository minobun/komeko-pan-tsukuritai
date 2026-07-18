import type { FlourBrand } from "@/lib/types";
import { BrandListItem } from "./brand-list-item";

type Props = {
  brands: FlourBrand[];
  /** 銘柄ID → 感想件数。キーがない銘柄は0件として扱う */
  reviewCounts: Record<string, number>;
};

/** タイル形式だと項目を上下に見比べられないため、縦1列のリスト形式で並べる（issue #65） */
export function BrandList({ brands, reviewCounts }: Props) {
  if (brands.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-stone-300 bg-white px-4 py-8 text-center text-sm text-stone-500">
        条件に合う銘柄が見つかりませんでした。
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {brands.map((brand) => (
        <li key={brand.id}>
          <BrandListItem
            brand={brand}
            reviewCount={reviewCounts[brand.id] ?? 0}
          />
        </li>
      ))}
    </ul>
  );
}
