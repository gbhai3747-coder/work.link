import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { BookingForm } from "@/components/workers/booking-form";
import { SiteHeader } from "@/components/layout/site-header";
import { BackButton } from "@/components/ui/back-button";
import { getCurrentUser } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", id)
    .maybeSingle();
  return { title: data?.full_name ?? "Worker profile" };
}

export default async function WorkerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createAdminClient();

  const [profileRes, workerRes, workerServicesRes, reviewsRes, completedRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("worker_profiles")
        .select(
          "id, description, experience_years, service_radius_km, is_available, created_at"
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("worker_services")
        .select("service_id")
        .eq("worker_id", id),
      supabase
        .from("reviews")
        .select("id, rating, comment, created_at, customer_id")
        .eq("worker_id", id),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("worker_id", id)
        .eq("status", "completed"),
    ]);

  const profile = profileRes.data;
  const worker = workerRes.data;
  if (!profile || profile.role !== "worker" || !worker) {
    notFound();
  }

  const serviceIds = (workerServicesRes.data ?? []).map((ws) => ws.service_id);
  const { data: services } = serviceIds.length
    ? await supabase.from("services").select("id, name").in("id", serviceIds)
    : { data: [] as { id: string; name: string }[] };

  const reviews = reviewsRes.data ?? [];
  const customerIds = [...new Set(reviews.map((r) => r.customer_id))];
  const { data: customers } = customerIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", customerIds)
    : { data: [] as { id: string; full_name: string }[] };
  const customerNames = new Map(
    (customers ?? []).map((customer) => [customer.id, customer.full_name])
  );

  const rating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : null;
  const completedJobs = completedRes.count ?? 0;

  const user = await getCurrentUser();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <BackButton label="Back to results" fallbackHref="/workers" />

        <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="shrink-0">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-emerald-100 dark:ring-emerald-900"
                />
              ) : (
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-3xl font-bold text-white shadow-lg">
                  {initials(profile.full_name)}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {profile.full_name}
                </h1>
                {worker.is_available ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    Available now
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    Currently offline
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1">
                  <span className="text-amber-400" aria-hidden>★</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {rating ? rating.toFixed(1) : "New"}
                  </span>
                  · {reviews.length} review{reviews.length === 1 ? "" : "s"}
                </span>
                <span>
                  {completedJobs} completed job{completedJobs === 1 ? "" : "s"}
                </span>
                <span>{worker.experience_years} yr experience</span>
              </div>

              <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Travels up to {Number(worker.service_radius_km)} km
              </p>

              {services && services.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {services.map((service) => (
                    <span
                      key={service.id}
                      className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300"
                    >
                      {service.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {worker.description && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              About
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {worker.description}
            </p>
          </section>
        )}

      <section
        id="book"
        className="mt-8 scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8"
      >
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Book this worker
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Send a request with your job details and preferred time.
        </p>
        <div className="mt-5">
          {!user ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-6 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Log in as a customer to book this worker.
              </p>
              <Link
                href={`/login?next=${encodeURIComponent(`/workers/${id}#book`)}`}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition-all hover:-translate-y-px hover:bg-zinc-700 hover:shadow-md active:translate-y-0 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Log in to book
              </Link>
            </div>
          ) : user.user_metadata?.role === "worker" ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              You&apos;re signed in as a worker. Switch to a customer account to
              book services.
            </p>
          ) : (
            <BookingForm
              workerId={id}
              services={services?.map((s) => ({ id: s.id, name: s.name })) ?? []}
            />
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Reviews
        </h2>
        {reviews.length > 0 ? (
          <ul className="mt-4 space-y-4">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                      {initials(customerNames.get(review.customer_id) ?? "Customer")}
                    </span>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {customerNames.get(review.customer_id) ?? "Customer"}
                    </p>
                    <span className="ml-1 text-sm text-amber-400" aria-label={`${review.rating} out of 5 stars`}>
                      {"★".repeat(review.rating)}
                      <span className="text-zinc-300 dark:text-zinc-600">
                        {"★".repeat(5 - review.rating)}
                      </span>
                    </span>
                  </div>
                  <time className="text-xs text-zinc-400 dark:text-zinc-500">
                    {formatDate(review.created_at)}
                  </time>
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {review.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/60 px-4 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              No reviews yet
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Be the first to book and leave one.
            </p>
          </div>
        )}
      </section>
      </main>
    </>
  );
}
