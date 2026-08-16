"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signup, type AuthFormState } from "@/app/actions/auth";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm({
  initialRole,
}: {
  initialRole?: "customer" | "worker" | null;
}) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    signup,
    null
  );

  return (
    <form action={action} noValidate>
      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            required
          />
          <FieldError errors={state?.errors?.fullName} />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
          <FieldError errors={state?.errors?.email} />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
            required
          />
          <FieldError errors={state?.errors?.password} />
        </div>

        <div>
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+1 555 000 1234"
            required
          />
          <FieldError errors={state?.errors?.phone} />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            I am a
          </span>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { value: "customer", label: "Customer", desc: "Hire workers" },
                { value: "worker", label: "Worker", desc: "Offer services" },
              ] as const
            ).map(({ value, label, desc }) => (
              <label
                key={value}
                className="relative flex cursor-pointer flex-col gap-0.5 rounded-lg border border-zinc-300 p-3 text-sm has-[:checked]:border-zinc-900 has-[:checked]:ring-2 has-[:checked]:ring-zinc-200 dark:border-zinc-700 dark:has-[:checked]:border-zinc-50 dark:has-[:checked]:ring-zinc-800"
              >
                <input
                  type="radio"
                  name="role"
                  value={value}
                  className="sr-only"
                  defaultChecked={value === (initialRole ?? "customer")}
                  required
                />
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {label}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {desc}
                </span>
              </label>
            ))}
          </div>
          <FieldError errors={state?.errors?.role} />
        </div>

        <Alert message={state?.message} />

        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Create account
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
