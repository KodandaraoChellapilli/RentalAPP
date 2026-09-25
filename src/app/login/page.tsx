import { LoginForm } from "@/components/LoginForm";
import { BrandMark } from "@/components/BrandMark";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reason?: string; next?: string }>;
}) {
  const { error, reason, next } = await searchParams;

  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <div className="mx-auto grid min-h-dvh w-full max-w-5xl lg:grid-cols-2">
        <div className="relative hidden overflow-hidden lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/login-hero.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <p className="text-3xl font-semibold tracking-tight">Ready for the yard.</p>
            <p className="mt-2 max-w-sm text-sm text-white/80">West Ridge Rentals equipment, transports, and condition photos.</p>
          </div>
        </div>
        <div className="flex items-center px-4 py-10 sm:px-8">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 flex items-center gap-3">
              <BrandMark className="h-9 w-9" />
              <p className="text-[22px] font-semibold tracking-tight text-stone-900">West Ridge Rentals</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/login-hero.png" alt="" className="mb-8 h-40 w-full rounded-xl object-cover lg:hidden" />
            <h1 className="text-[26px] font-semibold leading-8 tracking-tight text-stone-900">Welcome back</h1>
            <p className="mt-1 mb-6 text-[26px] font-semibold leading-8 tracking-tight text-stone-900">Ready for the yard.</p>
            <LoginForm error={error} reason={reason} nextPath={next} />
          </div>
        </div>
      </div>
    </div>
  );
}
