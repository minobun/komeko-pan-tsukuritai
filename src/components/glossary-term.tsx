"use client";

// issue #101: 各画面の見出し・本文に出てくる用語を、その場で意味を確認できるようにする。
// 定義は用語集（src/lib/glossary.ts）を参照し、文言をここに持たない。
// スマホが主要な閲覧環境のため、hoverではなくタップ（クリック）で開閉する。

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { getGlossaryTerm, type GlossaryTermId } from "@/lib/glossary";

type Props = {
  id: GlossaryTermId;
  /** 見出し語と違う表記で埋め込みたい場合に指定する（例: 「米粉パン」） */
  children?: ReactNode;
};

export function GlossaryTerm({ id, children }: Props) {
  const { term, description } = getGlossaryTerm(id);
  const [isOpen, setIsOpen] = useState(false);
  const tooltipId = useId();
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <span ref={containerRef} className="relative inline-block">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-describedby={isOpen ? tooltipId : undefined}
        onClick={() => setIsOpen((open) => !open)}
        className="cursor-help underline decoration-dotted decoration-from-font underline-offset-4 hover:decoration-solid"
      >
        {children ?? term}
      </button>
      {isOpen && (
        <span
          role="tooltip"
          id={tooltipId}
          // 見出しの中でも使うため、フォントサイズ・色は用語集の説明として固定する
          className="absolute left-0 top-full z-10 mt-1 block w-64 rounded-lg border border-amber-100 bg-white p-3 text-left text-xs font-normal leading-relaxed text-stone-700 shadow-lg sm:w-72"
        >
          {description}
        </span>
      )}
    </span>
  );
}
