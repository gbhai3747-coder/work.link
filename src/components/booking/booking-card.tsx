"use client";

import { useState } from "react";
import Link from "next/link";

import { updateBookingStatus } from "@/app/actions/bookings";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { LocationText } from "@/components/location/location-text";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  availableActions,
  type BookingActionDef,
  type BookingData,
  type NextBookingStatus,
} from "@/lib/bookings";
import type { BookingStatus, UserRole } from "@/lib/supabase/database.types";
import { formatDate } from "@/lib/utils";

type BookingCardProps = {
  booking: BookingData;
  role: UserRole;
};

const CONTACT_STATUSES: BookingStatus[] = [
  "accepted",
  "in_progress",
  "completed",
];

export function BookingCard({ booking, role }: BookingCardProps) {
  const [pendingAction, setPendingAction] = useState<NextBookingStatus | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const actions = availableActions(role, booking.status);
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
    <li className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
            {booking.serviceName}
          </h3>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Requested {formatDate(booking.createdAt)}
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
        {booking.jobDescription}
      </p>

      <dl className="mt-4 space-y-1.5 text-sm [&_dd]:min-w-0 [&_dd]:break-words">
        <div className="flex gap-2">
          <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">
            Preferred time
          </dt>
          <dd className="text-zinc-900 dark:text-zinc-50">
            {formatDate(booking.preferredTime)}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">
            {role === "worker" ? "Customer" : "Worker"}
          </dt>
          <dd className="text-zinc-900 dark:text-zinc-50">
            {booking.otherPartyName ?? "—"}
          </dd>
        </div>
        {booking.address && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">
              Address
            </dt>
            <dd className="text-zinc-900 dark:text-zinc-50">
              {booking.address}
            </dd>
          </div>
        )}
        {role === "worker" && booking.lat != null && booking.lng != null && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">
              Approx. location
            </dt>
            <dd className="text-zinc-900 dark:text-zinc-50">
              <LocationText lat={booking.lat} lng={booking.lng} /> (shared by
              the customer)
            </dd>
          </div>
        )}
        {showContact && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">
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

      {error && <div className="mt-4"><Alert message={error} /></div>}

      <div className="mt-5 flex flex-wrap items-center gap-2">
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
        <Link
          href={`/bookings/${booking.id}`}
          className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          Details
        </Link>
      </div>
    </li>
  );
}
