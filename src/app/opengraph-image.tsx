// WBS 6.1: SNS共有時のOGP画像。ビルド時に一度だけ生成される
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE_NAME}｜米粉の銘柄からレシピを探す`;

const HEADLINE = "米粉の銘柄から、";
const HEADLINE2 = "パンのレシピを探す。";
const CAPTION = "運営者が試作済みのレシピと銘柄ごとの成分情報";

/**
 * satoriはwoff2非対応で、next/font経由のフォントも取り出せないため、
 * Google FontsからTTFを実体で取得する。画像内で使う文字だけをsubsetして
 * ImageResponseのバンドル上限（500KB）に収める。
 */
async function loadNotoSansJp(): Promise<ArrayBuffer | null> {
  const text = [SITE_NAME, HEADLINE, HEADLINE2, CAPTION].join("");
  const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`;
  try {
    // 新しめのUAだとwoff2を返されるため、TTFを受け取れるUAを明示する
    const css = await fetch(cssUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64)" },
    }).then((res) => res.text());
    const fontUrl = css.match(/src: url\(([^)]+)\)/)?.[1];
    if (!fontUrl) return null;
    return await fetch(fontUrl).then((res) => res.arrayBuffer());
  } catch (err) {
    // フォント取得の失敗でデプロイ全体を落とさない（文字が豆腐になるだけに留める）
    console.error("[opengraph-image] font fetch failed:", err);
    return null;
  }
}

export default async function OpengraphImage() {
  const font = await loadNotoSansJp();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "#92400e", // Tailwind amber-800（サイトのキーカラー）
          color: "#fffbeb",
          padding: "80px",
        }}
      >
        <div style={{ fontSize: 34, color: "#fcd34d" }}>{SITE_NAME}</div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 28,
            fontSize: 82,
            lineHeight: 1.3,
          }}
        >
          <div>{HEADLINE}</div>
          <div>{HEADLINE2}</div>
        </div>
        <div style={{ marginTop: 36, fontSize: 30, color: "#fde68a" }}>
          {CAPTION}
        </div>
        <div style={{ marginTop: 12, fontSize: 26, color: "#fcd34d" }}>
          {SITE_URL.replace(/^https:\/\//, "")}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [{ name: "Noto Sans JP", data: font, weight: 700, style: "normal" }]
        : [],
    },
  );
}
