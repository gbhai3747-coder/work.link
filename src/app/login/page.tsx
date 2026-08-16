import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { BackButton } from "@/components/ui/back-button";

export const metadata: Metadata = {
  title: "Log in | WORKLINK",
  description: "Log in to your WORKLINK account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next =
    typeof params.next === "string" && params.next.startsWith("/")
      ? params.next
      : null;

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <BackButton className="mb-6" />
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Log in to your WORKLINK account.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
