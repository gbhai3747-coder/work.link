import Link from "next/link";
import type { Metadata } from "next";

import { SiteHeader } from "@/components/layout/site-header";
import { BackButton } from "@/components/ui/back-button";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Services",
  description: "Browse service categories and find workers near you.",
};

export const dynamic = "force-dynamic";

const tileGradients = [
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-indigo-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-sky-600",
];

export default async function ServicesPage() {
  const supabase = await createClient();
  const { data: services, error } = await supabase
    .from("services")
    .select("id, name, slug")
    .order("name");

  // TEMP DIAGNOSTICS - safe info only (no keys/secrets). Remove after verifying.
  try {
    const ref = new URL(env.supabaseUrl).hostname.split(".")[0] ?? "unknown";
    console.error("[services:diag] query finished", {
      supabaseRef: ref,
      envSet: {
        url: Boolean(env.supabaseUrl),
        anonKey: Boolean(env.supabaseAnonKey),
        serviceRoleKey: Boolean(env.supabaseServiceRoleKey),
      },
      rowCount: services?.length ?? 0,
      errorCode: error?.code ?? null,
      errorMessage: error?.message ?? null,
    });
  } catch {
    // diagnostics must never crash the page
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        <BackButton />
        <div className="mt-4 flex flex-col items-start gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Services
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Pick a category to find available workers near you.
          </p>
        </div>

        {services && services.length > 0 ? (
          <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <li key={service.id} className="flex">
                <Link
                  href={`/workers?service=${encodeURIComponent(service.slug)}`}
                  className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-600/10 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-700"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-emerald-950/60"
                  />
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${
                      tileGradients[index % tileGradients.length]
                    } text-lg font-bold text-white shadow-md`}
                  >
                    {service.name[0]?.toUpperCase()}
                  </span>
                  <h2 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-50">
                    {service.name}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Find {service.name.toLowerCase()} workers near you
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 transition-colors group-hover:text-emerald-600 dark:text-emerald-400">
                    Browse workers
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/60 px-4 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden
              >
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </span>
            <p className="mt-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Service categories haven&apos;t been added yet.
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Run
              <code className="mx-1 rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                supabase/seed.sql
              </code>
              to seed them.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
