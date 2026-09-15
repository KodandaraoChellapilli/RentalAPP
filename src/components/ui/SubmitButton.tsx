"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  pendingLabel,
  className,
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
  variant?: "primary" | "dark" | "ghost" | "danger";
}) {
  const { pending } = useFormStatus();
  const variantClass =
    variant === "dark"
      ? "btn-dark"
      : variant === "ghost"
        ? "btn-ghost"
        : variant === "danger"
          ? "btn-danger"
          : "btn-primary";

  return (
    <button className={cn("btn", variantClass, className)} type="submit" disabled={disabled || pending}>
      {pending ? pendingLabel || "Saving…" : children}
    </button>
  );
}
