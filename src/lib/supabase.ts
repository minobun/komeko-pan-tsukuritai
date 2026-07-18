import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていません（.env.local.example 参照）",
  );
}

/**
 * ISR用の再検証間隔（秒）。Supabaseへの全リクエストをNext.jsのData Cacheに載せ、
 * この間隔＋手動再検証（/api/revalidate）でのみDBへアクセスする。
 * Supabase Freeの休止対策として、閲覧リクエストが直接DBに到達しない構成にする
 * （docs/mvp/spec.md §6）。
 */
export const REVALIDATE_SECONDS = 3600;

/** 手動再検証（revalidateTag）用のキャッシュタグ */
export const SUPABASE_CACHE_TAG = "supabase";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  global: {
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        next: { revalidate: REVALIDATE_SECONDS, tags: [SUPABASE_CACHE_TAG] },
      }),
  },
});
