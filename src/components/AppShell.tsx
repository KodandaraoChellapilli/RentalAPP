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
    <div className="min-h-screen bg-[var(--background)] text-stone-900">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        <AppSidebar role={user.role} pathname={pathname} userName={user.name} />
        <MobileDrawer
          open={mobileOpen}
          role={user.role}
          pathname={pathname}
          userName={user.name}
          onClose={() => setMobileOpen(false)}
        />
        <div className="flex min-h-screen min-w-0 flex-col">
          <AppHeader
            title={pageTitleFor(pathname)}
            user={user}
            roleLabel={roleLabelFor(user.role)}
            onOpenNav={() => setMobileOpen(true)}
          />
          <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-8">{children}</main>
          <MobileBottomNav role={user.role} pathname={pathname} />
        </div>
      </div>
    </div>
  );
}
