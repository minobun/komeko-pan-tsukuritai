import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getGlossaryTerm } from "@/lib/glossary";
import { GlossaryTerm } from "../glossary-term";

afterEach(cleanup);

const psyllium = getGlossaryTerm("psyllium");

describe("GlossaryTerm", () => {
  it("用語集の見出し語を表示する", () => {
    render(<GlossaryTerm id="psyllium" />);
    expect(screen.getByRole("button").textContent).toBe(psyllium.term);
  });

  it("初期状態では定義を表示しない", () => {
    render(<GlossaryTerm id="psyllium" />);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("クリックすると用語集の定義を表示する（issue #101）", () => {
    render(<GlossaryTerm id="psyllium" />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("tooltip").textContent).toBe(psyllium.description);
  });

  it("もう一度クリックすると閉じる", () => {
    render(<GlossaryTerm id="psyllium" />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("Escキーで閉じる", () => {
    render(<GlossaryTerm id="psyllium" />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("外側をクリックすると閉じる", () => {
    render(
      <div>
        <GlossaryTerm id="psyllium" />
        <span data-testid="outside">外</span>
      </div>,
    );
    fireEvent.click(screen.getByRole("button"));
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("開いている間だけ定義をaria-describedbyで関連付ける", () => {
    render(<GlossaryTerm id="psyllium" />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.getAttribute("aria-describedby")).toBeNull();

    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.getAttribute("aria-describedby")).toBe(
      screen.getByRole("tooltip").id,
    );
  });

  it("見出し語と違う表記で本文に埋め込める", () => {
    render(<GlossaryTerm id="komeko">米粉パン</GlossaryTerm>);
    expect(screen.getByRole("button").textContent).toBe("米粉パン");
  });
});
