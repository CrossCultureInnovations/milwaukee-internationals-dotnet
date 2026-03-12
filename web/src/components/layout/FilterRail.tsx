import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function FilterRail({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 rounded-xl border border-border/50 bg-card/50 p-3 sm:flex-row sm:items-center",
        className
      )}
    >
      {children}
    </div>
  );
}
