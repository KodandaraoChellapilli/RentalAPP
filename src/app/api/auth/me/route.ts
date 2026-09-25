import { NextRequest } from "next/server";
import { fail, json, options, requireApiUser } from "@/lib/api/http";
import { homeFor } from "@/lib/constants";
import { roleLabelFor } from "@/lib/nav";

function roleHome(role: "ADMIN" | "MANAGER" | "EMPLOYEE" | "CUSTOMER") {
  if (role === "ADMIN" || role === "MANAGER") return "owner";
  if (role === "EMPLOYEE") return "employee";
  return "customer";
}

export function OPTIONS() {
  return options();
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    return json({
      user: {
        ...user,
        roleLabel: roleLabelFor(user.role),
        home: roleHome(user.role),
        webHome: homeFor(user.role),
      },
    });
  } catch (error) {
    return fail(error);
  }
}
