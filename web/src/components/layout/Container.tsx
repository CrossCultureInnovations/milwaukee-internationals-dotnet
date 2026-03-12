import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("container mx-auto max-w-[1120px] px-4", className)}>
      {children}
    </div>
  );
}
