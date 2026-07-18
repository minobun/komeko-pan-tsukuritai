import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
});

// 各ページはtitle/descriptionとcanonicalだけを上書きし、OGPの共通項目はここを継承する。
// openGraphを個別ページで指定すると親の指定ごと置き換わるため、
// ページ側では buildPageMetadata（@/lib/metadata）を使って必ず全項目を組み立てる。
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}｜米粉の銘柄からレシピを探す`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: SITE_NAME,
    url: "/",
    title: `${SITE_NAME}｜米粉の銘柄からレシピを探す`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME}｜米粉の銘柄からレシピを探す`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJp.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-stone-50 text-stone-800">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
        <SiteFooter />
        {/* WBS 6.5: アクセス解析。Vercelダッシュボード側でAnalyticsを有効化して使う */}
        <Analytics />
      </body>
    </html>
  );
}
