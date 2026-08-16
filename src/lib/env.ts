/**
 * Central place to read environment variables.
 * Only NEXT_PUBLIC_* values are safe to expose to the browser; anything else
 * must only be used from server-side code (server actions / route handlers).
 */

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  // Server-only credential. Never reference from a client component.
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
} as const;

export function isEnvConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
