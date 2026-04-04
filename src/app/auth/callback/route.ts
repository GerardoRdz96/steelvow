import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function sanitizeRedirectPath(path: string): string {
  // Must start with / and not contain // (prevents protocol-relative redirects)
  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }
  return path;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "signup"
    | "magiclink"
    | "recovery"
    | "invite"
    | "email"
    | null;
  const next = sanitizeRedirectPath(searchParams.get("next") ?? "/dashboard");

  const supabase = await createClient();

  // PKCE flow (code exchange)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Magic link / OTP flow (token_hash)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
