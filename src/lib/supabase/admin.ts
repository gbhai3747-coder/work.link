import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Server-only Supabase client using the service-role key.
 * Bypasses Row Level Security. NEVER import this from a client component or
 * route that renders client-accessible data — only use inside server actions
 * / route handlers / DALs that need to read location data for proximity search.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    env.supabaseUrl,
    env.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
