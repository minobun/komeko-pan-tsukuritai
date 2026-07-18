import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

const NAV_ITEMS = [
  { href: "/recipes", label: "レシピ" },
  { href: "/brands", label: "米粉銘柄" },
  { href: "/about", label: "About" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-amber-100 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-amber-900 sm:text-xl"
        >
          {SITE_NAME}
        </Link>
        <nav aria-label="メインナビゲーション">
          <ul className="flex items-center gap-4 text-sm font-medium text-stone-600 sm:gap-6 sm:text-base">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="transition-colors hover:text-amber-800"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
