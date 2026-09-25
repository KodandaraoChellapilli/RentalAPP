import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  error: {
    className: "border-red-200 bg-red-50 text-red-800",
    icon: AlertCircle,
  },
  success: {
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: CheckCircle2,
  },
  warning: {
    className: "border-amber-200 bg-amber-50 text-amber-900",
    icon: TriangleAlert,
  },
  info: {
    className: "border-sky-200 bg-sky-50 text-sky-900",
    icon: Info,
  },
} as const;

export function Alert({
  variant,
  children,
  className,
}: {
  variant: keyof typeof VARIANTS;
  children: React.ReactNode;
  className?: string;
}) {
  const config = VARIANTS[variant];
  const Icon = config.icon;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded border px-4 py-3 text-sm", config.className, className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
