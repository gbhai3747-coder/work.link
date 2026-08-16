import Link from "next/link";
import type { Metadata } from "next";

import { BookingSections } from "@/components/booking/booking-sections";
import { RealtimeBookings } from "@/components/booking/realtime-bookings";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getBookingsForCustomer } from "@/lib/bookings-data";
import { requireRole } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Customer Dashboard",
  description: "Find and book trusted local workers.",
};

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  const { profile } = await requireRole("customer");
  const bookings = await getBookingsForCustomer();

  return (
    <div className="flex min-h-full flex-col">
      <DashboardHeader role="customer" />
      <RealtimeBookings />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              Welcome back, {profile.full_name.split(/\s+/)[0]}
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Find a worker, book a job, and track your requests.
            </p>
          </div>
          <Link
            href="/workers"
            className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Find a worker
          </Link>
        </div>

        <section className="mt-8" aria-labelledby="customer-bookings-heading">
          <h2
            id="customer-bookings-heading"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Your bookings
          </h2>
          <div className="mt-4">
            <BookingSections
              bookings={bookings}
              role="customer"
              emptyTitle="No bookings yet"
              emptyMessage="Find a worker nearby and send your first booking request."
              ctaHref="/workers"
              ctaLabel="Find a worker"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
