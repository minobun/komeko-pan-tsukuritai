import type { FlourBrand } from "@/lib/types";
import { BrandCard } from "./brand-card";

export function BrandGrid({ brands }: { brands: FlourBrand[] }) {
  if (brands.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-stone-300 bg-white px-4 py-8 text-center text-sm text-stone-500">
        条件に合う銘柄が見つかりませんでした。
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {brands.map((brand) => (
        <li key={brand.id}>
          <BrandCard brand={brand} />
        </li>
      ))}
    </ul>
  );
}
