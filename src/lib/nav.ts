import {
  BarChart3,
  CalendarDays,
  Clock3,
  HardHat,
  LayoutDashboard,
  Package,
  Settings,
  Truck,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { COMPANY_NAME } from "@/lib/brand";
import type { Role } from "@/lib/constants";

export type NavItem = { href: string; label: string; icon: LucideIcon };
export type NavGroup = { label?: string; links: NavItem[] };

export const ADMIN_NAV: NavGroup[] = [
  {
    links: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/rentals", label: "Rentals", icon: Package },
      { href: "/admin/equipment", label: "Equipment", icon: Wrench },
      { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/admin/transports", label: "Transports", icon: Truck },
    ],
  },
  {
    label: "People",
    links: [
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/employees", label: "Employees", icon: HardHat },
    ],
  },
  {
    label: "Admin",
    links: [
      { href: "/admin/hours", label: "Time Clock", icon: Clock3 },
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
      { href: "/account", label: "Settings", icon: Settings },
    ],
  },
];

export const EMPLOYEE_NAV: NavGroup[] = [
  {
    links: [
      { href: "/employee/clock", label: "Time Clock", icon: Clock3 },
      { href: "/employee/jobs", label: "Transports", icon: Truck },
      { href: "/employee/equipment", label: "Equipment", icon: Wrench },
      { href: "/account", label: "Settings", icon: Settings },
    ],
  },
];

export const CUSTOMER_NAV: NavGroup[] = [
  {
    links: [
      { href: "/customer/rentals", label: "My Rentals", icon: Wallet },
      { href: "/account", label: "Settings", icon: Settings },
    ],
  },
];

const PAGE_TITLES: Array<{ match: string; title: string }> = [
  { match: "/admin/dashboard", title: "Dashboard" },
  { match: "/admin/equipment/new", title: "Add Equipment" },
  { match: "/admin/equipment", title: "Equipment" },
  { match: "/admin/rentals", title: "Rentals" },
  { match: "/admin/calendar", title: "Calendar" },
  { match: "/admin/schedule/new", title: "New Schedule" },
  { match: "/admin/transports", title: "Transports" },
  { match: "/admin/deliveries", title: "Deliveries" },
  { match: "/admin/pickups", title: "Pickups" },
  { match: "/admin/customers/new", title: "Add Customer" },
  { match: "/admin/customers", title: "Customers" },
  { match: "/admin/employees/new", title: "Add Employee" },
  { match: "/admin/employees", title: "Employees" },
  { match: "/admin/hours", title: "Time Clock" },
  { match: "/admin/reports", title: "Reports" },
  { match: "/employee/clock", title: "Time Clock" },
  { match: "/employee/jobs", title: "Transports" },
  { match: "/employee/deliver", title: "Record delivery" },
  { match: "/employee/pickup", title: "Record pickup" },
  { match: "/employee/equipment", title: "Equipment" },
  { match: "/customer/rentals", title: "My Rentals" },
  { match: "/account", title: "Settings" },
];

export function navGroupsFor(role: Role) {
  if (role === "ADMIN") return ADMIN_NAV;
  if (role === "EMPLOYEE") return EMPLOYEE_NAV;
  return CUSTOMER_NAV;
}

export function navLinksFor(role: Role, options?: { includeSettings?: boolean }) {
  const links = navGroupsFor(role).flatMap((group) => group.links);
  if (options?.includeSettings) return links;
  return links.filter((link) => link.href !== "/account");
}

export function pageTitleFor(pathname: string) {
  const found = PAGE_TITLES.find((item) => pathname === item.match || pathname.startsWith(`${item.match}/`));
  return found?.title || COMPANY_NAME;
}

export function roleLabelFor(role: Role) {
  if (role === "ADMIN") return "Owner";
  if (role === "EMPLOYEE") return "Employee";
  return "Customer";
}

export function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/account") return pathname === "/account" || pathname.startsWith("/account/");
  if (href === "/admin/transports") {
    return (
      pathname.startsWith("/admin/transports") ||
      pathname.startsWith("/admin/deliveries") ||
      pathname.startsWith("/admin/pickups")
    );
  }
  return pathname.startsWith(`${href}/`);
}

export function homeHrefFor(role: Role) {
  return navLinksFor(role)[0]?.href || "/";
}
