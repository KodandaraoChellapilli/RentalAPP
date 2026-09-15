import { json, options } from "@/lib/api/http";

export function OPTIONS() {
  return options();
}

export async function GET() {
  return json({ ok: true, name: "Ridgeline Rentals" });
}
