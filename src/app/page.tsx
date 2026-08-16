import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const serviceTileGradients = [
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-indigo-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-sky-600",
];

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2l2.9 6.26L21.5 9.27l-4.75 4.45 1.13 6.54L12 17.07 6.12 20.26l1.13-6.54L2.5 9.27l6.6-1.01L12 2Z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default async function Home() {
  const supabase = await createAdminClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, name, slug")
    .order("name");

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.09),transparent_60%)]" />
            <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-500/10" />
            <div className="absolute -right-24 top-44 h-80 w-80 rounded-full bg-teal-300/20 blur-3xl dark:bg-teal-500/10" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]" />
          </div>

          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-16 pt-20 text-center sm:pb-24 sm:pt-28">
            <p className="animate-fade-up mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-1.5 text-xs font-medium text-emerald-700 shadow-sm backdrop-blur dark:border-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Trusted local workers near you
            </p>

            <h1 className="animate-fade-up max-w-3xl text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl md:text-6xl">
              Find and book trusted{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 bg-clip-text text-transparent dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-400">
                local workers
              </span>{" "}
              near you
            </h1>

            <p
              className="animate-fade-up mt-6 max-w-2xl text-balance text-lg text-zinc-600 dark:text-zinc-400"
              style={{ animationDelay: "80ms" }}
            >
              Plumbers, electricians, cleaners, tutors and more — browse nearby
              pros, check ratings, and book in minutes.
            </p>

            <div
              className="animate-fade-up mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row"
              style={{ animationDelay: "160ms" }}
            >
              <Link
                href="/workers"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-7 text-base font-semibold text-white shadow-lg shadow-zinc-900/10 transition-all hover:-translate-y-0.5 hover:bg-zinc-700 hover:shadow-xl hover:shadow-zinc-900/15 active:translate-y-0 dark:bg-zinc-50 dark:text-zinc-900 dark:shadow-black/20 dark:hover:bg-zinc-200"
              >
                Find a worker
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/signup?role=worker"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-300 bg-white/60 px-7 text-base font-semibold text-zinc-900 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:translate-y-0 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-50 dark:hover:bg-zinc-800"
              >
                Offer your services
              </Link>
            </div>

            <div
              className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400"
              style={{ animationDelay: "240ms" }}
            >
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-emerald-500" />
                Verified profiles
              </span>
              <span className="inline-flex items-center gap-1.5">
                <StarIcon className="h-4 w-4 text-amber-400" />
                Transparent ratings
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon className="h-4 w-4 text-emerald-500" />
                Local only
              </span>
            </div>
          </div>
        </section>

        {/* Popular services */}
        {services && services.length > 0 && (
          <section className="mx-auto w-full max-w-6xl px-4 pb-20">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-balance text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                Popular services
              </h2>
              <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
                Browse categories and find trusted workers operating near you.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {services.map((service, index) => (
                <Link
                  key={service.id}
                  href={`/workers?service=${encodeURIComponent(service.slug)}`}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-600/10 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-700"
                >
                  <span
                    className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${
                      serviceTileGradients[index % serviceTileGradients.length]
                    } text-lg font-bold text-white shadow-md`}
                  >
                    {service.name[0]?.toUpperCase()}
                  </span>
                  <span className="mt-3 block text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {service.name}
                  </span>
                  <span className="mt-1 block text-xs font-medium text-emerald-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:text-emerald-400">
                    Browse →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* How it works */}
        <section className="border-y border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-balance text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                How it works
              </h2>
              <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
                Getting a trusted local pro is as easy as one, two, three.
              </p>
            </div>

            <ol className="mt-10 grid gap-6 sm:grid-cols-3">
              {[
                {
                  icon: <MapPinIcon className="h-6 w-6" />,
                  title: "Share your location",
                  desc: "Tell us roughly where you are — we keep the exact coordinates private.",
                },
                {
                  icon: <StarIcon className="h-6 w-6" />,
                  title: "Compare trusted workers",
                  desc: "Browse nearby pros by rating, experience and completed jobs.",
                },
                {
                  icon: <CalendarIcon className="h-6 w-6" />,
                  title: "Book in minutes",
                  desc: "Send a request, agree on a time, and track the job from start to finish.",
                },
              ].map((step, index) => (
                <li
                  key={step.title}
                  className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="absolute right-5 top-5 text-xs font-bold text-zinc-300 dark:text-zinc-600">
                    0{index + 1}
                  </span>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-300">
                    {step.icon}
                  </span>
                  <h3 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-50">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {step.desc}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Why WORKLINK */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <MapPinIcon className="h-5 w-5" />,
                title: "Nearby, vetted pros",
                desc: "Find workers that operate within your area, sorted by distance.",
              },
              {
                icon: <StarIcon className="h-5 w-5" />,
                title: "Transparent ratings",
                desc: "Real reviews and completed job counts help you choose with confidence.",
              },
              {
                icon: <ShieldIcon className="h-5 w-5" />,
                title: "Easy booking",
                desc: "Send a request, agree on a time, and track the job from start to finish.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-700"
              >
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-300">
                  {feature.icon}
                </span>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
