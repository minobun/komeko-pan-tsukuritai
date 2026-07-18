import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-amber-100 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-stone-500 sm:px-6">
        <p>
          当サイトのレシピと米粉銘柄の紐付け情報は、運営者による独自調査（レシピ内の目視確認）に基づくものです。レシピ本文・写真は転載せず、各レシピサイトへのリンクを掲載しています。
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <ul className="flex flex-wrap gap-4">
            <li>
              <Link href="/recipes" className="hover:text-amber-800">
                レシピ一覧
              </Link>
            </li>
            <li>
              <Link href="/brands" className="hover:text-amber-800">
                米粉銘柄一覧
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-amber-800">
                運営ポリシー・お問い合わせ
              </Link>
            </li>
          </ul>
          <p>© {new Date().getFullYear()} {SITE_NAME}</p>
        </div>
      </div>
    </footer>
  );
}
