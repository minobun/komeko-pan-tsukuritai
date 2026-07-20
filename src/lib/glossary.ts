// 米粉パンの用語集（issue #100）。
// 当サイトは「吸水率」「サイリウム」など、作り慣れていない人には馴染みのない
// 用語を前提にしているため、定義をここ1箇所に集約する。
// Aboutページの用語集セクションと、各画面の用語ツールチップ（issue #101）が
// このデータを共有し、文言の二重管理をしない。

export type GlossaryTermId =
  | "komeko"
  | "water_absorption"
  | "psyllium"
  | "gluten"
  | "oil";

export type GlossaryTerm = {
  id: GlossaryTermId;
  /** 画面に表示する見出し語 */
  term: string;
  /** 2行程度の定義。ツールチップに収まる長さに保つ */
  description: string;
};

/**
 * 用語の追加はこの配列への追記だけで済ませる（spec §4 の RECIPE_INGREDIENTS と同じ方針）。
 * 表示順はこの配列の順序に従う。
 */
export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: "komeko",
    term: "米粉",
    description:
      "うるち米を製粉した粉。粒度や製法によって性質が大きく変わり、近年は農林水産省が用途別の指標を定めるなど、パン用途に適した細かい米粉が流通しています。",
  },
  {
    id: "water_absorption",
    term: "吸水率",
    description:
      "粉に対してどれだけの水分を加えるかの割合。米粉は銘柄ごとに適正な吸水率が異なり、同じレシピでも仕上がりが変わる主な要因になります。",
  },
  {
    id: "psyllium",
    term: "サイリウム",
    description:
      "オオバコの種皮を粉末にしたもの。生地に粘りを与え、グルテンを使わない米粉パンをしっとり焼き上げるために使われることが多い材料です。",
  },
  {
    id: "gluten",
    term: "グルテン",
    description:
      "小麦由来のたんぱく質。生地の膨らみを支えますが、グルテンフリーを目的とする場合は使いません。最初から配合されている米粉の銘柄もあります。",
  },
  {
    id: "oil",
    term: "油",
    description:
      "米油・太白ごま油・バターなど、生地に加える油脂。しっとりした食感や日持ちに影響します。油を使わないレシピもあります。",
  },
];

/**
 * IDから用語を引く。存在しないIDは呼び出し側の消し忘れなので、
 * 黙って未定義を返さず例外にする。
 */
export function getGlossaryTerm(id: GlossaryTermId): GlossaryTerm {
  const found = GLOSSARY_TERMS.find((term) => term.id === id);
  if (!found) throw new Error(`未定義の用語ID: ${id}`);
  return found;
}
