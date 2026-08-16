import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/database.types";

/**
 * Data Access Layer: centralizes auth + authorization so every data request
 * and mutation goes through the same checks.
 */

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
});

export const getCurrentWorkerProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("worker_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
});

/** Redirects to /login when the caller is not signed in. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Redirects when the signed-in user does not have the required role. */
export async function requireRole(role: UserRole) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== role) {
    redirect(profile.role === "worker" ? "/worker/dashboard" : "/customer/dashboard");
  }
  return { user, profile };
}
