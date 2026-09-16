import { LoginForm } from "@/components/LoginForm";
import { BrandMark } from "@/components/BrandMark";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reason?: string; next?: string }>;
}) {
  const { error, reason, next } = await searchParams;

  return (
    <div className="min-h-dvh overflow-y-auto bg-[#14110e] px-6 py-8 text-stone-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 lg:min-h-[calc(100dvh-4rem)] lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        <div className="max-w-lg shrink-0">
          <BrandMark className="h-14 w-14" />
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-amber-400">Ridgeline Rentals</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight lg:text-5xl">Yard operations, in one place.</h1>
          <p className="mt-4 text-stone-400">
            Clock time, deliver and pick up machines with photo records, track live rental charges, and give
            customers a clear window into their jobs.
          </p>
        </div>

        <div className="w-full max-w-md shrink-0 overflow-hidden rounded-3xl bg-white text-stone-900 shadow-2xl">
          <div className="bg-[#1c1917] px-8 py-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400">Staff & customer portal</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Sign in</h2>
          </div>
          <div className="px-8 py-7">
            <LoginForm error={error} reason={reason} nextPath={next} />
          </div>
          <p className="px-8 pb-5 text-center text-xs text-stone-400">
            Ridgeline Rentals &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
