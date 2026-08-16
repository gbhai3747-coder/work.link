"use client";

import { useState } from "react";

import { updateBookingStatus } from "@/app/actions/bookings";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { LocationText } from "@/components/location/location-text";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  BOOKING_STATUS_DESCRIPTIONS,
  BOOKING_STATUS_LABELS,
  availableActions,
  type BookingActionDef,
  type BookingData,
  type NextBookingStatus,
} from "@/lib/bookings";
import type { BookingStatus, UserRole } from "@/lib/supabase/database.types";
import { cn, formatDate } from "@/lib/utils";

const TIMELINE: BookingStatus[] = [
  "pending",
  "accepted",
  "in_progress",
  "completed",
];

const CONTACT_STATUSES: BookingStatus[] = [
  "accepted",
  "in_progress",
  "completed",
];

export function BookingDetailClient({
  booking,
  role,
}: {
  booking: BookingData;
  role: UserRole;
}) {
  const [pendingAction, setPendingAction] = useState<NextBookingStatus | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const actions = availableActions(role, booking.status);
  const terminal =
    booking.status === "rejected" || booking.status === "cancelled";
  const currentStepIndex = TIMELINE.indexOf(booking.status);
  const showContact =
    CONTACT_STATUSES.includes(booking.status) &&
    (booking.otherPartyName || booking.otherPartyPhone);

  const runAction = async (action: BookingActionDef) => {
    if (pendingAction) return;
    setPendingAction(action.next);
    setError(null);
    const result = await updateBookingStatus({
      bookingId: booking.id,
      status: action.next,
    });
    if (!result.ok) {
      setPendingAction(null);
      setError(result.error);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {booking.serviceName}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {role === "worker" ? "Customer" : "Worker"}:{" "}
              {booking.otherPartyName ?? "—"}
            </p>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        <dl className="mt-5 space-y-2 text-sm [&_dd]:min-w-0 [&_dd]:break-words">
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-zinc-500 dark:text-zinc-400">
              What needs doing
            </dt>
            <dd className="text-zinc-900 dark:text-zinc-50">
              {booking.jobDescription}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-zinc-500 dark:text-zinc-400">
              Preferred time
            </dt>
            <dd className="text-zinc-900 dark:text-zinc-50">
              {formatDate(booking.preferredTime)}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-zinc-500 dark:text-zinc-400">
              Requested
            </dt>
            <dd className="text-zinc-900 dark:text-zinc-50">
              {formatDate(booking.createdAt)}
            </dd>
          </div>
          {booking.address && (
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-zinc-500 dark:text-zinc-400">
                Address
              </dt>
              <dd className="text-zinc-900 dark:text-zinc-50">
                {booking.address}
              </dd>
            </div>
          )}
          {role === "worker" &&
            booking.lat != null &&
            booking.lng != null && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-zinc-500 dark:text-zinc-400">
                  Approx. location
                </dt>
                <dd className="text-zinc-900 dark:text-zinc-50">
                  <LocationText lat={booking.lat} lng={booking.lng} /> (shared
                  by the customer)
                </dd>
              </div>
            )}
          {showContact && (
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-zinc-500 dark:text-zinc-400">
                Contact
              </dt>
              <dd className="text-zinc-900 dark:text-zinc-50">
                {[booking.otherPartyName, booking.otherPartyPhone]
                  .filter(Boolean)
                  .join(" · ")}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
          Booking status
        </h2>

        {terminal ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            {BOOKING_STATUS_DESCRIPTIONS[booking.status]}
          </p>
        ) : (
          <ol className="mt-5">
            {TIMELINE.map((step, index) => {
              const isDone = currentStepIndex > index;
              const isCurrent = currentStepIndex === index;
              return (
                <li key={step} className="relative flex gap-3 pb-7 last:pb-0">
                  {index < TIMELINE.length - 1 && (
                    <span
                      className={cn(
                        "absolute left-3.5 top-8 h-[calc(100%-1.5rem)] w-px",
                        isDone
                          ? "bg-emerald-500"
                          : "bg-zinc-200 dark:bg-zinc-700"
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                      isDone
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : isCurrent
                          ? "border-zinc-900 bg-white text-zinc-900 dark:border-zinc-50 dark:bg-zinc-950 dark:text-zinc-50"
                          : "border-zinc-300 bg-white text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500"
                    )}
                  >
                    {isDone ? "✓" : index + 1}
                  </span>
                  <div className="pt-0.5">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isCurrent
                          ? "text-zinc-900 dark:text-zinc-50"
                          : isDone
                            ? "text-zinc-700 dark:text-zinc-300"
                            : "text-zinc-500 dark:text-zinc-400"
                      )}
                    >
                      {BOOKING_STATUS_LABELS[step]}
                    </p>
                    {isCurrent && (
                      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                        {BOOKING_STATUS_DESCRIPTIONS[booking.status]}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {actions.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.next}
                variant={action.variant}
                size="sm"
                loading={pendingAction === action.next}
                disabled={pendingAction !== null}
                onClick={() => void runAction(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {error && <div className="mt-4"><Alert message={error} /></div>}
      </section>
    </div>
  );
}
