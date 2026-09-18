import { prisma } from "@/lib/prisma";
import { isRole } from "@/lib/constants";
import type { SessionUser } from "@/lib/session-token";

/** Reload name/email/role from DB so UI stays correct after seed/name updates. */
export async function hydrateSessionUser(session: SessionUser | null): Promise<SessionUser | null> {
  if (!session?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, role: true, customerId: true, active: true },
  });

  if (!user || !user.active || !isRole(user.role)) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    customerId: user.customerId,
  };
}
