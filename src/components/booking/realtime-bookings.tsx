"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to booking changes and refreshes the page so dashboards and the
 * booking detail view always reflect the latest status. Local changes are
 * already revalidated by the server actions; this catches changes made by the
 * other party (e.g. the worker accepting while the customer is watching).
 * Realtime respects RLS, so a user only receives events for their own bookings.
 */
export function RealtimeBookings() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("booking-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
