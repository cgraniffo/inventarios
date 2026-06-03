import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Flujo de magic link por token_hash (sin PKCE). Funciona aunque el enlace se
 * abra en un navegador o visor distinto al que pidió el enlace (típico en
 * celular: la app de correo abre el link en su propio webview).
 *
 * El template del correo apunta acá:
 *   {{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed&reason=missing_token_hash`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error) {
    const reason = encodeURIComponent(`${error.name}:${error.message}`.slice(0, 200));
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed&reason=${reason}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
