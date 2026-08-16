"use server";

import { redirect } from "next/navigation";
import { AuthError } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validators";

export type AuthFormState = {
  errors?: {
    fullName?: string[];
    email?: string[];
    password?: string[];
    phone?: string[];
    role?: string[];
  };
  message?: string;
} | null;

function dashboardForRole(role: string) {
  return role === "worker" ? "/worker/dashboard" : "/customer/dashboard";
}

/**
 * Ensures a profiles (and, for workers, worker_profiles) row exists for a
 * signed-in user. This mirrors the `handle_new_user` DB trigger as a safety
 * net for accounts created before the trigger was deployed, so a successful
 * login can never silently bounce off a role-protected page for a missing row.
 * Writes go through the user's own session (RLS `profiles_insert_own`), so no
 * privileged client is needed and a race with the trigger is ignored.
 */
async function ensureProfileRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: {
    id: string;
    email?: string | null;
    user_metadata?: { [key: string]: unknown } | null;
  }
): Promise<void> {
  const meta = user.user_metadata ?? {};
  const role = meta.role === "worker" ? "worker" : "customer";
  const fullName =
    typeof meta.full_name === "string" && meta.full_name.trim().length > 0
      ? meta.full_name.trim()
      : user.email?.split("@")[0] ?? "New user";
  const phone = typeof meta.phone === "string" ? meta.phone : "";

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from("profiles").insert({
      id: user.id,
      full_name: fullName,
      phone,
      role,
    });
  }

  if (role === "worker") {
    const { data: workerExisting } = await supabase
      .from("worker_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!workerExisting) {
      await supabase.from("worker_profiles").insert({ id: user.id });
    }
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    switch (error.code) {
      case "user_already_exists":
        return "An account with this email already exists. Try logging in.";
      case "invalid_credentials":
        return "Invalid email or password.";
      case "email_not_confirmed":
        return "Please confirm your email address before logging in.";
      default:
        return error.message;
    }
  }
  return "Something went wrong. Please try again.";
}

export async function signup(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validated = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone"),
    role: formData.get("role"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { fullName, email, password, phone, role } = validated.data;

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        role,
      },
    },
  });

  if (error) {
    return { message: errorMessage(error) };
  }

  // When email confirmation is enabled no session is returned yet; the user
  // must click the link in the confirmation email first.
  redirect("/auth/confirm");
}

export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { email, password } = validated.data;

  // `next` comes from a hidden field set by ?next= on the login page (e.g. a
  // booking page the user was redirected from). Only allow same-site paths.
  const rawNext = formData.get("next");
  const next =
    typeof rawNext === "string" &&
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//")
      ? rawNext
      : null;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { message: errorMessage(error) };
  }

  const role =
    data.user.user_metadata?.role === "worker" ? "worker" : "customer";

  await ensureProfileRows(supabase, data.user);

  redirect(next ?? dashboardForRole(role));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
