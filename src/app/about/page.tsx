import { BakedBadge } from "@/components/baked-badge";
import { SpecifiedFlourBadge } from "@/components/specified-flour-badge";
import { buildPageMetadata } from "@/lib/metadata";
import { CONTACT_FORM_URL, SITE_NAME } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "About・運営ポリシー",
  description: `${SITE_NAME}の運営ポリシー。掲載情報の調査方法、著作権の考え方、削除依頼・お問い合わせ窓口、広告表記について。`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-stone-900">
        About・運営ポリシー
      </h1>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-stone-900">このサイトについて</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">
          {SITE_NAME}
          は、米粉パンのレシピと「そのレシピで実際に使われている米粉銘柄」の紐付け情報をまとめた個人運営のキュレーションサイトです。
          米粉は銘柄によって吸水率などの性質が異なるため、同じレシピでも仕上がりが変わります。サイリウムや油を使うかどうかはレシピ側で決まる一方、レシピで指定された銘柄そのものは手に入りにくいことも少なくありません。
          銘柄からレシピを逆引きできるようにすることで、「家にある米粉で何が作れるか分からない」という悩みを解決することを目指しています。
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-stone-900">掲載情報の方針</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-700">
          <li>
            レシピ本文・写真は転載していません。掲載しているのは外部レシピへのリンクと、著作者名・掲載サイト名、および運営者による独自調査の情報（使用銘柄・実食メモ）のみです。
          </li>
          <li>
            レシピに記載のある銘柄には、その記載根拠を明示しています。
            <span className="mx-1 inline-flex align-middle">
              <SpecifiedFlourBadge source="text" />
            </span>
            はレシピ本文に銘柄の指定が明記されているもの、
            <span className="mx-1 inline-flex align-middle">
              <SpecifiedFlourBadge source="visual" />
            </span>
            はレシピの写真・動画等から銘柄が目視で確認できるものです。
          </li>
          <li>
            <span className="mr-1 inline-flex align-middle">
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                作れるかも？
              </span>
            </span>
            はレシピに銘柄の記載はないものの、運営者がその米粉でも作れると考えて独自に紐付けたものです。レシピ側が指定している銘柄ではありません。
          </li>
          <li>
            <span className="mr-1 inline-flex align-middle">
              <BakedBadge />
            </span>
            は運営者が実際にその銘柄で試作し、感想を掲載しているものです。
          </li>
          <li>
            メーカー名・商品名は事実の参照として記載しており、各メーカーとの提携・公認関係はありません。
          </li>
          <li>
            商品画像は運営者の自前撮影分、または許諾のあるもののみ掲載しています。
          </li>
          <li>
            リンク切れは定期的にチェックしていますが、リンク先の内容・価格等は変更されている場合があります。
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-stone-900">
          削除依頼・お問い合わせ
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">
          掲載内容に誤りがある場合や、ご自身のレシピへのリンク掲載を望まれない場合は、下記の窓口よりご連絡ください。確認のうえ、速やかに修正・非公開対応を行います。
        </p>
        {CONTACT_FORM_URL ? (
          <a
            href={CONTACT_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-full bg-amber-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
          >
            お問い合わせフォームを開く ↗
          </a>
        ) : (
          <p className="mt-4 rounded-md bg-stone-100 px-4 py-3 text-sm text-stone-500">
            お問い合わせフォームは現在準備中です。
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-stone-900">広告表記</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">
          当サイトの銘柄詳細ページには、Amazonアソシエイト・楽天アフィリエイトによる購入リンクを掲載する場合があります。リンク経由で商品が購入されると、運営者が紹介料を受け取ることがあります。掲載する銘柄・レシピの選定や実食メモの内容は、広告の有無にかかわらず運営者の独自の判断で行っています。
        </p>
      </section>
    </article>
  );
}
