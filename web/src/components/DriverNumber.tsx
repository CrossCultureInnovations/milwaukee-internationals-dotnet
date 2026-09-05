import { cn, displayNumber } from "../lib/utils";

/**
 * A driver's number, styled as the car number it is in practice — the thing
 * students are texted and staff call out in a parking lot.
 *
 * Tabular figures and a shared minimum width keep the numbers in a list
 * aligned, so a column of them stays scannable. Renders nothing when the
 * driver has no display ID.
 */
export function DriverNumber({
  displayId,
  className,
}: {
  displayId?: string | null;
  className?: string;
}) {
  const number = displayNumber(displayId);
  if (!number) return null;

  return (
    <span
      title={`Driver number ${number}`}
      className={cn(
        "inline-flex min-w-[1.7rem] shrink-0 items-center justify-center rounded-full",
        "bg-primary/12 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-primary",
        "ring-1 ring-inset ring-primary/25",
        className
      )}
    >
      {number}
    </span>
  );
}
