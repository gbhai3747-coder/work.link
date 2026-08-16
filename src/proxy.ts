import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

// Protect only the dashboards' own sections. Compare by first path segment so
// "/worker" does not also match the public "/workers" directory pages.
const protectedPrefixes = ["customer", "worker"];

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const pathname = request.nextUrl.pathname;
  const segment = pathname.split("/")[1] ?? "";
  const isProtected = protectedPrefixes.includes(segment);

  // Optimistic gate: unauthenticated users cannot enter dashboards.
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // NOTE: authenticated users are deliberately NOT bounced away from /login or
  // /signup. Bouncing them there created an infinite redirect loop whenever a
  // signed-in user had no profile row (e.g. DB not ready): dashboard's
  // requireRole() redirects to /login, this middleware bounced it back to the
  // dashboard, and so on forever. Letting the page render breaks the loop.

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
