import "server-only";

import { cache } from "react";

import type { BookingData } from "@/lib/bookings";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type {
  BookingActionDef,
  BookingData,
} from "@/lib/bookings";
export {
  ALLOWED_TRANSITIONS,
  BOOKING_STATUS_DESCRIPTIONS,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_ORDER,
  availableActions,
  canTransition,
  isActiveStatus,
} from "@/lib/bookings";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

async function enrichBookings(
  rows: BookingRow[]
): Promise<BookingData[]> {
  if (rows.length === 0) return [];

  const supabase = await createClient();
  const serviceIds = [...new Set(rows.map((row) => row.service_id))];

  const { data: services } = await supabase
    .from("services")
    .select("id, name")
    .in("id", serviceIds);
  const serviceNameById = new Map(
    (services ?? []).map((service) => [service.id, service.name])
  );

  const contactEntries = await Promise.all(
    rows.map(async (row) => {
      const { data } = await supabase.rpc("get_booking_contact", {
        p_booking_id: row.id,
      });
      return [row.id, data?.[0] ?? null] as const;
    })
  );
  const contactByBooking = new Map(contactEntries);

  return rows.map((row) => {
    const contact = contactByBooking.get(row.id);
    return {
      id: row.id,
      workerId: row.worker_id,
      customerId: row.customer_id,
      serviceName: serviceNameById.get(row.service_id) ?? "Service",
      jobDescription: row.job_description,
      preferredTime: row.preferred_time,
      status: row.status,
      address: row.address,
      lat: row.lat,
      lng: row.lng,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      otherPartyName: contact?.other_party_name ?? null,
      otherPartyPhone: contact?.other_party_phone ?? null,
    };
  });
}

export const getBookingsForCustomer = cache(async (): Promise<BookingData[]> => {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  return enrichBookings(rows ?? []);
});

export const getBookingsForWorker = cache(async (): Promise<BookingData[]> => {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  return enrichBookings(rows ?? []);
});

/**
 * Loads a single booking only when the signed-in user is a participant.
 * RLS guarantees this: `bookings_select_participants` only returns rows where
 * the current user is the customer or the worker.
 */
export const getBookingForParticipant = cache(
  async (bookingId: string): Promise<BookingData | null> => {
    const supabase = await createClient();
    const { data: row } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();
    if (!row) return null;
    const [booking] = await enrichBookings([row]);
    return booking ?? null;
  }
);
