import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { homeFor } from "@/lib/constants";

export default async function HomePage() {
  const user = await getSession();
  redirect(user ? homeFor(user.role) : "/login");
}
