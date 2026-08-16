"use client";

import Link from "next/link";
import { useActionState } from "react";

import { login, type AuthFormState } from "@/app/actions/auth";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ next }: { next?: string | null }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    login,
    null
  );

  return (
    <form action={action} noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <div className="space-y-4">
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
            autoComplete="current-password"
            placeholder="Your password"
            required
          />
          <FieldError errors={state?.errors?.password} />
        </div>

        <Alert message={state?.message} />

        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Log in
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        New to WORKLINK?{" "}
        <Link
          href="/signup"
          className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
