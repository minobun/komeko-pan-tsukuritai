// データ更新後の手動再検証エンドポイント（docs/mvp/spec.md §6）
// 使い方: curl -X POST "https://<host>/api/revalidate?secret=<REVALIDATE_SECRET>"

import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { SUPABASE_CACHE_TAG } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const secret = env.REVALIDATE_SECRET;
  if (!secret || request.nextUrl.searchParams.get("secret") !== secret) {
    return NextResponse.json({ message: "invalid secret" }, { status: 401 });
  }

  revalidateTag(SUPABASE_CACHE_TAG, "max");
  return NextResponse.json({ revalidated: true, now: new Date().toISOString() });
}
