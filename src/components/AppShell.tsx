"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileBottomNav, MobileDrawer } from "@/components/layout/MobileNav";
import { pageTitleFor, roleLabelFor } from "@/lib/nav";
import type { SessionUser } from "@/lib/session";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-dvh overflow-hidden bg-[var(--background)] text-stone-900">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        <AppSidebar role={user.role} pathname={pathname} userName={user.name} />
        <MobileDrawer
          open={mobileOpen}
          role={user.role}
          pathname={pathname}
          userName={user.name}
          onClose={() => setMobileOpen(false)}
        />
        <div className="flex min-h-0 min-w-0 flex-col">
          <AppHeader
            title={pageTitleFor(pathname)}
            user={user}
            roleLabel={roleLabelFor(user.role)}
            onOpenNav={() => setMobileOpen(true)}
          />
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 pb-28 lg:px-7 lg:pb-8">
            {children}
          </main>
          <MobileBottomNav role={user.role} pathname={pathname} />
        </div>
      </div>
    </div>
  );
}
