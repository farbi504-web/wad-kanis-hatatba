import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "accent" | "danger" | "outline";

export function Badge({
  children,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "badge",
        variant === "primary" && "badge-primary",
        variant === "secondary" && "badge-secondary",
        variant === "accent" && "badge-accent",
        variant === "danger" && "badge-danger",
        variant === "outline" && "border border-app text-soft",
        className,
      )}
    >
      {children}
    </span>
  );
}
