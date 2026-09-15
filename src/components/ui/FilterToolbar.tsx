"use client";

import { Search } from "lucide-react";

export function FilterToolbar({
  search,
  onSearch,
  placeholder = "Search",
  children,
  resultLabel,
}: {
  search: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
  resultLabel?: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <label className="relative block min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          className="field pl-10"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {resultLabel ? <p className="text-sm text-stone-500">{resultLabel}</p> : null}
      </div>
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-stone-600">
      <span className="sr-only">{label}</span>
      <select className="field min-h-11 w-auto py-2" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
