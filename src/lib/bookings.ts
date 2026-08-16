import type { BookingStatus, UserRole } from "@/lib/supabase/database.types";

/**
 * Shared booking domain logic. Pure module — safe to import from both server
 * and client components (no `server-only`), so the UI can derive allowed
 * actions without a round trip. The database trigger
 * `validate_booking_status_transition` remains the authoritative enforcement.
 */

export type BookingData = {
  id: string;
  workerId: string;
  customerId: string;
  serviceName: string;
  jobDescription: string;
  preferredTime: string;
  status: BookingStatus;
  address: string | null;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  updatedAt: string;
  otherPartyName: string | null;
  otherPartyPhone: string | null;
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  in_progress: "In progress",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const BOOKING_STATUS_DESCRIPTIONS: Record<BookingStatus, string> = {
  pending: "Waiting for the worker to respond to this request.",
  accepted: "The worker has accepted this request.",
  in_progress: "The worker is working on the job.",
  completed: "The job has been completed.",
  rejected: "The worker declined this request.",
  cancelled: "This request was cancelled.",
};

export const BOOKING_STATUS_ORDER: BookingStatus[] = [
  "pending",
  "accepted",
  "in_progress",
  "completed",
  "rejected",
  "cancelled",
];

/**
 * Allowed status transitions per actor. Mirrors the database trigger
 * `validate_booking_status_transition` — the DB remains the source of truth,
 * this is used for UX (which buttons to show) and as a first line of defense.
 */
export const ALLOWED_TRANSITIONS: Record<
  UserRole,
  Partial<Record<BookingStatus, BookingStatus[]>>
> = {
  worker: {
    pending: ["accepted", "rejected"],
    accepted: ["in_progress"],
    in_progress: ["completed"],
  },
  customer: {
    pending: ["cancelled"],
  },
};

export function canTransition(
  role: UserRole,
  from: BookingStatus,
  to: BookingStatus
): boolean {
  return ALLOWED_TRANSITIONS[role][from]?.includes(to) ?? false;
}

export type NextBookingStatus = Exclude<BookingStatus, "pending">;

export type BookingActionDef = {
  next: NextBookingStatus;
  label: string;
  variant: "primary" | "outline" | "danger";
};

const ACTION_DEFS: Record<
  UserRole,
  Partial<Record<BookingStatus, BookingActionDef[]>>
> = {
  worker: {
    pending: [
      { next: "accepted", label: "Accept", variant: "primary" },
      { next: "rejected", label: "Reject", variant: "outline" },
    ],
    accepted: [
      { next: "in_progress", label: "Start job", variant: "primary" },
    ],
    in_progress: [
      { next: "completed", label: "Mark complete", variant: "primary" },
    ],
  },
  customer: {
    pending: [
      { next: "cancelled", label: "Cancel request", variant: "danger" },
    ],
  },
};

/** Actions a role can take from a given status (filtered by canTransition). */
export function availableActions(
  role: UserRole,
  status: BookingStatus
): BookingActionDef[] {
  return (ACTION_DEFS[role][status] ?? []).filter((action) =>
    canTransition(role, status, action.next)
  );
}

/** Whether a status is considered "active" (shown in the top section of dashboards). */
export function isActiveStatus(status: BookingStatus): boolean {
  return (
    status === "pending" ||
    status === "accepted" ||
    status === "in_progress"
  );
}
