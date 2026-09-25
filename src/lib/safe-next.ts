import { homeFor, type Role } from "@/lib/constants";

export function safeNextPath(value: string | null | undefined, role: Role) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return homeFor(role);
  }

  if (role !== "ADMIN" && role !== "MANAGER" && value.startsWith("/admin")) return homeFor(role);
  if (role === "MANAGER" && (value.startsWith("/admin/employees") || value.startsWith("/admin/reports"))) {
    return homeFor(role);
  }
  if (role === "CUSTOMER" && value.startsWith("/employee")) return homeFor(role);
  if (role === "EMPLOYEE" && value.startsWith("/customer")) return homeFor(role);

  return value;
}
