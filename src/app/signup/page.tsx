import type { Metadata } from "next";

import { SignupForm } from "@/components/auth/signup-form";
import { BackButton } from "@/components/ui/back-button";

export const metadata: Metadata = {
  title: "Create an account | WORKLINK",
  description: "Join WORKLINK as a customer or a worker.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const initialRole =
    params.role === "worker"
      ? "worker"
      : params.role === "customer"
        ? "customer"
        : null;

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <BackButton className="mb-6" />
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Create your WORKLINK account
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Find local pros or offer your services.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <SignupForm initialRole={initialRole} />
        </div>
      </div>
    </div>
  );
}
