import type { SessionUser } from "@/lib/session-token";
import { ServiceError } from "@/lib/services/errors";

export function requireOwner(user: SessionUser) {
  if (user.role !== "ADMIN") throw new ServiceError("You do not have access.", 403);
  return user;
}

export function requireStaff(user: SessionUser) {
  if (user.role !== "ADMIN" && user.role !== "EMPLOYEE") {
    throw new ServiceError("You do not have access.", 403);
  }
  return user;
}

export function requireCustomer(user: SessionUser) {
  if (user.role !== "CUSTOMER" && user.role !== "ADMIN") {
    throw new ServiceError("You do not have access.", 403);
  }
  if (user.role === "CUSTOMER" && !user.customerId) {
    throw new ServiceError("This login is not linked to a customer account.", 403);
  }
  return user;
}

export function canAccessEvent(user: SessionUser, employeeId?: string | null) {
  if (user.role === "ADMIN") return true;
  return user.role === "EMPLOYEE" && employeeId === user.id;
}

/** Employees may only work jobs assigned to them. Admins may work any job. */
export function assertCanAccessEvent(user: SessionUser, employeeId?: string | null) {
  if (!canAccessEvent(user, employeeId)) {
    throw new ServiceError("You do not have access.", 403);
  }
}
