import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold text-stone-900">
        ページが見つかりません
      </h1>
      <p className="mt-3 text-sm text-stone-600">
        お探しのページは削除されたか、URLが変更された可能性があります。
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-full bg-amber-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
      >
        トップページへ戻る
      </Link>
    </div>
  );
}
