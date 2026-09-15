"use client";

import { Menu } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import type { SessionUser } from "@/lib/session";

export function AppHeader({
  title,
  user,
  roleLabel,
  onOpenNav,
}: {
  title: string;
  user: SessionUser;
  roleLabel: string;
  onOpenNav: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="rounded-xl border border-stone-200 bg-white p-2 lg:hidden"
            onClick={onOpenNav}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="truncate text-lg font-semibold text-stone-900 lg:text-xl">{title}</h1>
        </div>
        <UserMenu user={user} roleLabel={roleLabel} />
      </div>
    </header>
  );
}
