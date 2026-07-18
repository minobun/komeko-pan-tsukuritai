import Link from "next/link";
import { getMakerName, type FlourBrand } from "@/lib/types";
import { BrandImage } from "./brand-image";

export function BrandChips({ brand }: { brand: FlourBrand }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {brand.has_gluten ? (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
          グルテン入り
        </span>
      ) : (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
          グルテンフリー
        </span>
      )}
      {brand.has_psyllium && (
        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
          サイリウム配合
        </span>
      )}
      {brand.is_bread_use && (
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
          製パン用
        </span>
      )}
      {brand.is_discontinued && (
        <span className="rounded-full border border-red-200 bg-white px-2 py-0.5 text-xs font-medium text-red-600">
          廃番
        </span>
      )}
    </div>
  );
}

export function BrandCard({ brand }: { brand: FlourBrand }) {
  return (
    <Link
      href={`/brands/${brand.id}`}
      className="flex h-full flex-col rounded-lg border border-amber-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <BrandImage
        brand={brand}
        className="mb-3 h-32 w-full rounded-md border border-stone-100"
      />
      <p className="text-xs text-stone-500">{getMakerName(brand)}</p>
      <h3 className="mt-0.5 font-semibold leading-snug text-stone-900">
        {brand.product_name}
      </h3>
      <div className="mt-3">
        <BrandChips brand={brand} />
      </div>
    </Link>
  );
}
