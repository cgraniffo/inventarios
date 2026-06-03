import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canonicalBase } from "@/lib/site-url";

/** Intercambia el `code` del magic link por una sesión y redirige al inicio. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const base = canonicalBase(origin);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${base}/auth/login?error=auth_failed&reason=no_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.session) {
    const reason = encodeURIComponent(
      `${error?.name ?? "no_session"}:${error?.message ?? "unknown"}`.slice(0, 200),
    );
    return NextResponse.redirect(`${base}/auth/login?error=auth_failed&reason=${reason}`);
  }

  return NextResponse.redirect(`${base}${next}`);
}
