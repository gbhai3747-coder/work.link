import Link from "next/link";

import { BookingCard } from "@/components/booking/booking-card";
import type { BookingData } from "@/lib/bookings";
import type { BookingStatus, UserRole } from "@/lib/supabase/database.types";

type SectionDef = {
  key: string;
  title: string;
  statuses: BookingStatus[];
};

function buildSections(role: UserRole): SectionDef[] {
  return role === "worker"
    ? [
        {
          key: "new",
          title: "New requests",
          statuses: ["pending"],
        },
        { key: "accepted", title: "Accepted", statuses: ["accepted"] },
        {
          key: "in_progress",
          title: "In progress",
          statuses: ["in_progress"],
        },
        { key: "completed", title: "Completed", statuses: ["completed"] },
        {
          key: "closed",
          title: "Closed",
          statuses: ["rejected", "cancelled"],
        },
      ]
    : [
        {
          key: "pending",
          title: "Pending requests",
          statuses: ["pending"],
        },
        { key: "accepted", title: "Accepted", statuses: ["accepted"] },
        {
          key: "in_progress",
          title: "In progress",
          statuses: ["in_progress"],
        },
        { key: "completed", title: "Completed", statuses: ["completed"] },
        {
          key: "closed",
          title: "Closed",
          statuses: ["rejected", "cancelled"],
        },
      ];
}

type BookingSectionsProps = {
  bookings: BookingData[];
  role: UserRole;
  emptyTitle: string;
  emptyMessage: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export function BookingSections({
  bookings,
  role,
  emptyTitle,
  emptyMessage,
  ctaHref,
  ctaLabel,
}: BookingSectionsProps) {
  const sections = buildSections(role);
  const visible = sections.filter((section) =>
    section.statuses.some((status) =>
      bookings.some((booking) => booking.status === status)
    )
  );

  if (visible.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">
          {emptyTitle}
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {emptyMessage}
        </p>
        {ctaHref && ctaLabel && (
          <Link
            href={ctaHref}
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {visible.map((section) => {
        const items = bookings.filter((booking) =>
          section.statuses.includes(booking.status)
        );
        return (
          <section key={section.key} aria-label={section.title}>
            <header className="flex items-center gap-2">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                {section.title}
              </h2>
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {items.length}
              </span>
            </header>

            <ul className="mt-3 space-y-4">
              {items.map((booking) => (
                <BookingCard key={booking.id} booking={booking} role={role} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
