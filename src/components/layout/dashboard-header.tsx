import Link from "next/link";

import { logout } from "@/app/actions/auth";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getCurrentUser } from "@/lib/dal";

export async function DashboardHeader({
  role,
}: {
  role: "customer" | "worker";
}) {
  const user = await getCurrentUser();
  const dashboardHref =
    role === "worker" ? "/worker/dashboard" : "/customer/dashboard";

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="shrink-0 text-lg font-bold tracking-tight text-zinc-900 transition-colors hover:text-emerald-700 dark:text-zinc-50 dark:hover:text-emerald-400"
        >
          WORK<span className="text-emerald-600 dark:text-emerald-400">LINK</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium text-zinc-600 dark:text-zinc-400 md:flex">
          <Link
            href="/workers"
            className="rounded-lg px-3 py-2 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            Find workers
          </Link>
          <Link
            href={dashboardHref}
            className="rounded-lg px-3 py-2 font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
          >
            Dashboard
          </Link>
        </nav>

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <span className="hidden max-w-48 truncate text-sm text-zinc-500 dark:text-zinc-400 lg:inline">
            {user?.email}
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Log out
            </button>
          </form>
          <MobileNav
            links={[
              { label: "Find workers", href: "/workers" },
              { label: "Dashboard", href: dashboardHref },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
