import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Supabase redirects here after email confirmation / OAuth with a ?code=.
 * Exchanges the code for a session, then routes the user to their dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const role =
        user?.user_metadata?.role === "worker" ? "worker" : "customer";
      const target = next.startsWith("/") && !next.startsWith("/login") ? next : `/`;
      return NextResponse.redirect(
        new URL(target === "/" ? `/${role}/dashboard` : target, origin)
      );
    }
  }

  return NextResponse.redirect(new URL("/login?message=auth_failed", origin));
}
