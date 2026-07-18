import type { FlourBrand } from "@/lib/types";

type Props = {
  brand: Pick<FlourBrand, "image_url" | "maker_name" | "product_name">;
  className?: string;
};

/**
 * 銘柄の商品画像。画像はpublic配下の自前撮影分（spec §6）を想定するが、
 * 任意URLも許容するためnext/imageではなくimgを使う。
 */
export function BrandImage({ brand, className }: Props) {
  if (!brand.image_url) {
    return (
      <div
        className={`flex items-center justify-center bg-amber-50 text-xs text-amber-300 ${className ?? ""}`}
      >
        No Image
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brand.image_url}
      alt={`${brand.maker_name} ${brand.product_name}`}
      loading="lazy"
      className={`bg-white object-contain ${className ?? ""}`}
    />
  );
}
