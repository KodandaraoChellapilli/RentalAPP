"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import type { SessionUser } from "@/lib/session";
import { SubmitButton } from "@/components/ui/SubmitButton";

function initialsFor(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

export function UserMenu({ user, roleLabel }: { user: SessionUser; roleLabel: string }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onEsc(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="flex min-h-0 items-center gap-3 rounded border border-stone-200 bg-white px-2 py-1.5 hover:bg-stone-50"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="hidden text-right sm:block">
          <div className="text-sm font-medium leading-tight text-stone-900">{user.name}</div>
          <div className="text-xs text-stone-500">{roleLabel}</div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-800">
          {initialsFor(user.name)}
        </div>
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded border border-stone-200 bg-white shadow-lg">
          <div className="border-b border-stone-100 px-4 py-3">
            <p className="text-sm font-semibold text-stone-900">{user.name}</p>
            <p className="text-xs text-stone-500">{user.email}</p>
            <p className="mt-1 text-xs text-stone-400">{roleLabel}</p>
          </div>
          <div className="p-2">
            <Link
              href="/account"
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
              onClick={() => setOpen(false)}
            >
              <UserRound className="h-4 w-4" />
              Account settings
            </Link>
            <form action={logoutAction}>
              <SubmitButton
                variant="ghost"
                className="w-full justify-start border-0 text-stone-700 hover:bg-stone-50"
                pendingLabel="Logging out…"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </SubmitButton>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
