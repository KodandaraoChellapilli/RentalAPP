import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm card p-6 text-center">
        <div className="flex justify-center">
          <BrandMark className="h-9 w-9" />
        </div>
        <h1 className="mt-4 text-lg font-semibold">Page not found</h1>
        <p className="mt-1 text-sm text-stone-500">That page or record is not available for this account.</p>
        <Link className="btn btn-primary mt-5 w-full" href="/">
          Go home
        </Link>
      </div>
    </div>
  );
}
