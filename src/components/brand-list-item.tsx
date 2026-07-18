import Link from "next/link";
import { getMakerName, type FlourBrand } from "@/lib/types";
import { BrandChips } from "./brand-card";
import { BrandImage } from "./brand-image";
import { ReviewCountBadge } from "./review-count-badge";

type Props = {
  brand: FlourBrand;
  /** この銘柄を使って作った感想の件数（0件も明示表示する） */
  reviewCount: number;
};

/** 銘柄一覧の1行。上下で見比べられるよう、画像を左・情報を右の横並びにする */
export function BrandListItem({ brand, reviewCount }: Props) {
  return (
    <Link
      href={`/brands/${brand.id}`}
      className="flex items-start gap-4 rounded-lg border border-amber-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <BrandImage
        brand={brand}
        className="h-20 w-20 shrink-0 rounded-md border border-stone-100"
      />
      <div className="min-w-0">
        <p className="text-xs text-stone-500">{getMakerName(brand)}</p>
        <h3 className="mt-0.5 font-semibold leading-snug text-stone-900">
          {brand.product_name}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <BrandChips brand={brand} />
          <ReviewCountBadge count={reviewCount} />
        </div>
      </div>
    </Link>
  );
}
