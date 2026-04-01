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
  const next = sanitizeRedirectPath(searchParams.get("next") ?? "/dashboard");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
