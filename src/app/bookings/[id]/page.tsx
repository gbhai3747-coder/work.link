import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { BookingDetailClient } from "@/components/booking/booking-detail-client";
import { RealtimeBookings } from "@/components/booking/realtime-bookings";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { BackButton } from "@/components/ui/back-button";
import { getBookingForParticipant } from "@/lib/bookings-data";
import { getCurrentProfile, requireUser } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Booking details",
};

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const profile = await getCurrentProfile();
  const booking = await getBookingForParticipant(id);

  if (!booking || !profile) notFound();

  const dashboardHref =
    profile.role === "worker" ? "/worker/dashboard" : "/customer/dashboard";

  return (
    <div className="flex min-h-full flex-col">
      <DashboardHeader role={profile.role} />
      <RealtimeBookings />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <BackButton fallbackHref={dashboardHref} />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              Booking
            </h1>
            <p className="mt-1 break-all font-mono text-xs text-zinc-500 dark:text-zinc-400">
              {booking.id}
            </p>
          </div>
        </div>

        <BookingDetailClient booking={booking} role={profile.role} />
      </main>
    </div>
  );
}
