"use client";

import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { homeHrefFor, isNavActive, navGroupsFor, type NavItem } from "@/lib/nav";
import type { Role } from "@/lib/constants";
import { cn } from "@/lib/utils";

function navClass(active: boolean) {
  return cn(
    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
    active ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
  );
}

export function SidebarNav({
  role,
  pathname,
  onNavigate,
}: {
  role: Role;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {navGroupsFor(role).map((group, index) => (
        <div key={group.label || `group-${index}`} className={index > 0 ? "mt-6" : ""}>
          {group.label ? (
            <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              {group.label}
            </div>
          ) : null}
          <div className="space-y-1">
            {group.links.map((link) => (
              <SidebarLink key={link.href} link={link} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function SidebarLink({
  link,
  pathname,
  onNavigate,
}: {
  link: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const Icon = link.icon;
  const active = isNavActive(pathname, link.href);
  return (
    <Link href={link.href} onClick={onNavigate} className={navClass(active)}>
      <Icon className="h-4 w-4 shrink-0" />
      {link.label}
    </Link>
  );
}

export function AppSidebar({
  role,
  pathname,
  userName,
}: {
  role: Role;
  pathname: string;
  userName: string;
}) {
  return (
    <aside className="hidden border-r border-stone-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
      <div className="border-b border-stone-200 px-5 py-4">
        <Link href={homeHrefFor(role)} className="flex items-center gap-3">
          <BrandMark className="h-10 w-10" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-700">Ridgeline</p>
            <p className="text-lg font-semibold leading-none text-stone-900">Rentals</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <SidebarNav role={role} pathname={pathname} />
      </nav>
      <div className="border-t border-stone-200 px-4 py-3 text-xs text-stone-500">
        Signed in as <span className="text-stone-700">{userName}</span>
      </div>
    </aside>
  );
}
