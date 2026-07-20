import { describe, expect, it } from "vitest";
import {
  GLOSSARY_TERMS,
  getGlossaryTerm,
  type GlossaryTermId,
} from "../glossary";

describe("GLOSSARY_TERMS", () => {
  it("米粉パンの理解に必要な用語が定義されている（issue #100）", () => {
    const terms = GLOSSARY_TERMS.map((t) => t.term);
    expect(terms).toContain("米粉");
    expect(terms).toContain("吸水率");
    expect(terms).toContain("サイリウム");
    expect(terms).toContain("グルテン");
    expect(terms).toContain("油");
  });

  it("IDが重複していない", () => {
    const ids = GLOSSARY_TERMS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("すべての用語に定義文がある", () => {
    for (const term of GLOSSARY_TERMS) {
      expect(term.description.length).toBeGreaterThan(0);
    }
  });
});

describe("getGlossaryTerm", () => {
  it("IDに対応する用語を返す", () => {
    expect(getGlossaryTerm("psyllium").term).toBe("サイリウム");
  });

  it("定義されていないIDでは例外を投げる（用語の消し忘れを検知する）", () => {
    // 型上は存在しないIDだが、呼び出し側の消し忘れを実行時にも検知したい
    expect(() => getGlossaryTerm("unknown" as GlossaryTermId)).toThrow();
  });
});
