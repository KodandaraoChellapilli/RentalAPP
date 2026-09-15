"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { SidebarNav } from "@/components/layout/AppSidebar";
import { homeHrefFor, isNavActive, navLinksFor, type NavItem } from "@/lib/nav";
import type { Role } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function MobileDrawer({
  open,
  role,
  pathname,
  userName,
  onClose,
}: {
  open: boolean;
  role: Role;
  pathname: string;
  userName: string;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close navigation" onClick={onClose} />
      <div className="relative flex h-full w-[min(20rem,86vw)] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-4">
          <Link href={homeHrefFor(role)} className="flex items-center gap-3" onClick={onClose}>
            <BrandMark className="h-9 w-9" compact />
            <span className="font-semibold">Ridgeline Rentals</span>
          </Link>
          <button type="button" className="rounded-xl p-2 hover:bg-stone-100" onClick={onClose} aria-label="Close navigation">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <SidebarNav role={role} pathname={pathname} onNavigate={onClose} />
        </nav>
        <div className="border-t border-stone-200 px-4 py-3 text-xs text-stone-500">
          Signed in as <span className="text-stone-700">{userName}</span>
        </div>
      </div>
    </div>
  );
}

export function MobileBottomNav({ role, pathname }: { role: Role; pathname: string }) {
  const links = navLinksFor(role);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t border-stone-200 bg-white px-1 lg:hidden">
      {links.map((link) => (
        <BottomLink key={link.href} link={link} pathname={pathname} />
      ))}
    </nav>
  );
}

function BottomLink({ link, pathname }: { link: NavItem; pathname: string }) {
  const Icon = link.icon;
  const active = isNavActive(pathname, link.href);
  return (
    <Link
      href={link.href}
      className={cn(
        "flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 py-3 text-[11px]",
        active ? "text-orange-700" : "text-stone-500",
      )}
    >
      <Icon className="h-4 w-4" />
      {link.label}
    </Link>
  );
}
