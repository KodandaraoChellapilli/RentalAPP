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
      <rect width="48" height="48" rx={compact ? "10" : "14"} fill="#c2410c" />
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
    <div className="flex items-center gap-3">
      <BrandMark className="h-10 w-10" />
      <div>
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${
            inverted ? "text-amber-400" : "text-orange-700"
          }`}
        >
          West Ridge
        </p>
        <p className={`text-lg font-semibold leading-none ${inverted ? "text-white" : "text-stone-900"}`}>
          Rentals
        </p>
      </div>
    </div>
  );
}
