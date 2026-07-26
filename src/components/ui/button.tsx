"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "accent";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "btn",
          variant === "primary" && "btn-primary",
          variant === "secondary" && "btn-secondary",
          variant === "outline" && "btn-outline",
          variant === "ghost" && "btn-ghost",
          variant === "danger" && "btn-danger",
          variant === "accent" && "btn-accent",
          size === "sm" && "!text-xs !px-3 !py-1.5 !rounded-lg",
          size === "md" && "",
          size === "lg" && "!text-base !px-6 !py-3 !rounded-xl",
          size === "icon" && "!p-2.5 !rounded-lg",
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
