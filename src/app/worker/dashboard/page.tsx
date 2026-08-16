import type { Metadata } from "next";

import { BookingSections } from "@/components/booking/booking-sections";
import { RealtimeBookings } from "@/components/booking/realtime-bookings";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { WorkerDashboardClient } from "@/components/worker/dashboard-client";
import { getBookingsForWorker } from "@/lib/bookings-data";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Worker Dashboard",
  description: "Manage your availability, location, services and bookings.",
};

export const dynamic = "force-dynamic";

export default async function WorkerDashboardPage() {
  const { profile } = await requireRole("worker");
  const supabase = await createClient();

  const [workerRes, servicesRes, myServicesRes] = await Promise.all([
    supabase
      .from("worker_profiles")
      .select(
        "id, description, experience_years, service_radius_km, is_available, location_updated_at"
      )
      .eq("id", profile.id)
      .single(),
    supabase.from("services").select("id, name, slug").order("name"),
    supabase
      .from("worker_services")
      .select("service_id")
      .eq("worker_id", profile.id),
  ]);

  const workerProfile = workerRes.data;
  const bookings = await getBookingsForWorker();

  return (
    <div className="flex min-h-full flex-col">
      <DashboardHeader role="worker" />
      <RealtimeBookings />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          Worker dashboard
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {workerProfile?.is_available
            ? "You're visible in nearby searches."
            : "Go online to start receiving booking requests."}
        </p>

        {workerProfile && (
          <WorkerDashboardClient
            workerProfile={{
              description: workerProfile.description,
              experienceYears: workerProfile.experience_years,
              serviceRadiusKm: Number(workerProfile.service_radius_km),
              isAvailable: workerProfile.is_available,
              locationUpdatedAt: workerProfile.location_updated_at,
            }}
            services={servicesRes.data ?? []}
            selectedServiceIds={(myServicesRes.data ?? []).map(
              (ws) => ws.service_id
            )}
          />
        )}

        <section
          className="mt-10"
          aria-labelledby="worker-bookings-heading"
        >
          <h2
            id="worker-bookings-heading"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Your bookings
          </h2>
          <div className="mt-4">
            <BookingSections
              bookings={bookings}
              role="worker"
              emptyTitle="No bookings yet"
              emptyMessage="Go online and customers will be able to send you booking requests."
            />
          </div>
        </section>
      </main>
    </div>
  );
}
