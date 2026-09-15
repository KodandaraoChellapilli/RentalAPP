import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#14110e] px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="flex justify-center">
          <BrandMark className="h-12 w-12" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-stone-500">That page or record is not available for this account.</p>
        <Link className="btn btn-primary mt-6 w-full" href="/">
          Go home
        </Link>
      </div>
    </div>
  );
}
