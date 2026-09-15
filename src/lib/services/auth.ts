import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isRole } from "@/lib/constants";
import { encodeSession, type SessionUser } from "@/lib/session-token";
import { ServiceError } from "@/lib/services/errors";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function loginService(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase();
  if (!email || !password) throw new ServiceError("Email and password are required.");
  if (!EMAIL_RE.test(email)) throw new ServiceError("Enter a valid email address.");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) throw new ServiceError("Invalid email or password.", 401);

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new ServiceError("Invalid email or password.", 401);
  if (!isRole(user.role)) throw new ServiceError("This account cannot sign in.", 403);

  const session: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    customerId: user.customerId,
  };
  const token = await encodeSession(session);
  return { token, user: session };
}
