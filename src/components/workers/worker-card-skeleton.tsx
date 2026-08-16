export function WorkerCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <li
          key={index}
          aria-hidden
          className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start gap-3.5">
            <div className="h-14 w-14 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex-1 space-y-2.5 pt-1">
              <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-36 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
          <div className="mt-4 h-3 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-2 h-3 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-5 flex gap-2">
            <div className="h-9 flex-1 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-9 flex-1 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </li>
      ))}
    </ul>
  );
}
