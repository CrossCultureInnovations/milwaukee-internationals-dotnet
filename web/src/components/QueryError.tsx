import { AlertTriangle, RefreshCw } from "lucide-react";
import { ApiError } from "../api";
import { Button } from "./ui/button";

/**
 * Failed queries used to fall through to the "nothing here yet" empty state,
 * which reads as "no data" when the truth is "the request failed". Render this
 * instead whenever a query errors.
 */
export function QueryError({
  error,
  onRetry,
  label = "data",
}: {
  error: unknown;
  onRetry?: () => void;
  label?: string;
}) {
  const message =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : "An unexpected error occurred.";

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center dark:border-red-900/50 dark:bg-red-950/30">
      <AlertTriangle className="mx-auto h-6 w-6 text-red-600 dark:text-red-400" />
      <p className="mt-3 text-sm font-medium text-red-800 dark:text-red-300">
        Couldn't load {label}.
      </p>
      <p className="mt-1 text-sm text-red-700/80 dark:text-red-400/80">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );
}
