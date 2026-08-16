import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Server-side Supabase client that reads/writes the auth session cookie.
 * Used in Server Components, Server Actions and Route Handlers.
 * Runs against RLS with the user's privileges.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component. This can happen when a user is
          // signed in during a render pass. Safe to ignore as the refresh
          // middleware (src/proxy.ts) will handle the cookie rotation.
        }
      },
    },
  });
}
