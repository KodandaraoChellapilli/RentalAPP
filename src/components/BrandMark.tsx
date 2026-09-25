export function BrandMark({
  className = "h-9 w-9",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="48" height="48" rx={compact ? "6" : "8"} fill="#c2410c" />
      <path
        d="M8 36 L16 22 L24 30 L33 14 L40 36 Z"
        fill="#fff7ed"
        opacity="0.96"
      />
      <path d="M8 36 H40" stroke="#9a3412" strokeWidth="1.5" />
    </svg>
  );
}

export function BrandWordmark({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark className="h-8 w-8" />
      <p className={`text-[15px] font-semibold leading-tight ${inverted ? "text-white" : "text-stone-900"}`}>
        West Ridge Rentals
      </p>
    </div>
  );
}
