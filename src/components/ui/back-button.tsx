"use client";

import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

type BackButtonProps = {
  /** Route used when there is no usable browser history (default "/"). */
  fallbackHref?: string;
  /** Visible label next to the arrow. */
  label?: string;
  className?: string;
};

/**
 * History-aware back button. Prefers going back in the browser's history and
 * only falls back to `fallbackHref` when there is no previous entry, so users
 * are never sent to the homepage when a valid previous page exists.
 */
export function BackButton({
  fallbackHref = "/",
  label = "Back",
  className,
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Go back"
      className={cn(
        "group -ml-2 inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
        aria-hidden
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {label}
    </button>
  );
}
