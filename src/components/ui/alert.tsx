import { cn } from "@/lib/utils";

type FieldErrorProps = { errors?: string[] };

export function FieldError({ errors }: FieldErrorProps) {
  if (!errors?.length) return null;
  return (
    <ul className="mt-1 space-y-0.5">
      {errors.map((error) => (
        <li
          key={error}
          className="text-xs text-red-600 dark:text-red-400"
        >
          {error}
        </li>
      ))}
    </ul>
  );
}

export function Alert({
  message,
  className,
}: {
  message?: string | null;
  className?: string;
}) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
        className
      )}
    >
      {message}
    </div>
  );
}
