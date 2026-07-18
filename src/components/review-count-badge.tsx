/** 感想件数バッジ。0件は薄色で表示し、件数があるものと見分けやすくする */
export function ReviewCountBadge({ count }: { count: number }) {
  return (
    <span
      className={
        count > 0
          ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900"
          : "rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-400"
      }
    >
      感想 {count}件
    </span>
  );
}
