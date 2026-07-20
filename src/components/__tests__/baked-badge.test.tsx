import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BakedBadge } from "../baked-badge";

// vitestのglobalsは無効なので、testing-libraryの自動クリーンアップは効かない。
// 前のテストの描画結果が残ると要素が重複するため、明示的に片付ける
afterEach(cleanup);

describe("BakedBadge", () => {
  it("運営者がレシピを試したことが伝わる文言を表示する（issue #102）", () => {
    render(<BakedBadge />);
    expect(screen.getByText("運営者が試作済み")).toBeDefined();
  });

  it("「実食確認済み」という旧文言を表示しない", () => {
    render(<BakedBadge />);
    expect(screen.queryByText("実食確認済み")).toBeNull();
  });
});
