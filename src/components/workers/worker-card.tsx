import Link from "next/link";

import type { NearbyWorker } from "@/app/actions/search";
import { formatDistance } from "@/lib/utils";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function WorkerCard({ worker }: { worker: NearbyWorker }) {
  return (
    <li className="group relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-600/10 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-700">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-500 to-teal-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="flex items-start gap-3.5">
        {worker.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={worker.avatar_url}
            alt={worker.full_name}
            className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-emerald-100 dark:ring-emerald-900"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-md"
          >
            {initials(worker.full_name)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
              {worker.full_name}
            </h3>
          </div>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {worker.service_name} · {worker.experience_years} yr experience
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="text-amber-400" aria-hidden>
                ★
              </span>
              {worker.rating.toFixed(1)} · {worker.completed_jobs} job
              {worker.completed_jobs === 1 ? "" : "s"}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Available
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3 w-3"
                aria-hidden
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {formatDistance(worker.distance_km)}
            </span>
          </div>
        </div>
      </div>

      {worker.description && (
        <p className="mt-3.5 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {worker.description}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <Link
          href={`/workers/${worker.worker_id}`}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          View profile
        </Link>
        <Link
          href={`/workers/${worker.worker_id}#book`}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition-all hover:-translate-y-px hover:bg-emerald-500 hover:shadow-md active:translate-y-0"
        >
          Book
        </Link>
      </div>
    </li>
  );
}
