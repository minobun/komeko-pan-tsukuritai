import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * ISR用の再検証間隔（秒）。Supabaseへの全リクエストをNext.jsのData Cacheに載せ、
 * この間隔＋手動再検証（/api/revalidate）でのみDBへアクセスする。
 * Supabase Freeの休止対策として、閲覧リクエストが直接DBに到達しない構成にする
 * （docs/mvp/spec.md §6）。
 */
export const REVALIDATE_SECONDS = 300;

/** 手動再検証（revalidateTag）用のキャッシュタグ */
export const SUPABASE_CACHE_TAG = "supabase";

let client: SupabaseClient | null = null;

/**
 * クライアントはモジュール読み込み時ではなく初回クエリ時に生成する。
 * トップレベルで環境変数を検証すると、この定数だけを使うモジュール
 * （/api/revalidate 等）を読み込むだけでビルドが失敗してしまうため。
 */
export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていません（.env.local.example 参照。Vercelの場合はProject Settings > Environment Variablesで設定してください）",
    );
  }

  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          next: { revalidate: REVALIDATE_SECONDS, tags: [SUPABASE_CACHE_TAG] },
        }),
    },
  });
  return client;
}
