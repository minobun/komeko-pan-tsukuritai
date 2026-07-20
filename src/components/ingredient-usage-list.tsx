import type { RecipeIngredientUsage } from "@/lib/types";
import { GlossaryTerm } from "./glossary-term";

const USAGE_STYLE: Record<
  RecipeIngredientUsage["usage"],
  { text: string; className: string }
> = {
  used: { text: "使う", className: "bg-amber-100 text-amber-900" },
  unused: { text: "使わない", className: "bg-emerald-100 text-emerald-800" },
  unknown: { text: "未確認", className: "bg-stone-100 text-stone-500" },
};

/** レシピ側の材料使用有無（サイリウム・グルテン・油）の一覧表示（spec §4.1） */
export function IngredientUsageList({
  usages,
}: {
  usages: RecipeIngredientUsage[];
}) {
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {usages.map(({ key, glossaryId, usage }) => {
        const style = USAGE_STYLE[usage];
        return (
          <li
            key={key}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-100 bg-white px-3 py-1.5 text-sm shadow-sm"
          >
            <span className="text-stone-700">
              <GlossaryTerm id={glossaryId} />
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.className}`}
            >
              {style.text}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
