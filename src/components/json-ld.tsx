// WBS 6.2: 構造化データ（JSON-LD）の埋め込み用コンポーネント
//
// next/scriptではなく素の<script>を使う（JSON-LDは実行コードではなくデータのため）。
// JSON.stringifyはHTMLをエスケープしないので、"<" をunicodeに置換してXSSを防ぐ。

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
