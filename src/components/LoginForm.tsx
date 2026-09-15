"use client";

import { useMemo, useState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEMO_ACCOUNTS = [
  { role: "Owner / Admin", email: "admin@rental.app" },
  { role: "Employee", email: "employee@rental.app" },
  { role: "Customer", email: "abc@rental.app" },
];

export function LoginForm({
  error,
  reason,
  nextPath,
}: {
  error?: string;
  reason?: string;
  nextPath?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  const sessionMessage =
    reason === "expired" ? "Your session expired. Please sign in again before continuing." : null;

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const decodedError = useMemo(() => {
    if (!error) return null;
    try {
      return decodeURIComponent(error.replaceAll("+", " "));
    } catch {
      return error;
    }
  }, [error]);

  function validate() {
    if (!email.trim()) return "Email is required.";
    if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address.";
    if (!password) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return null;
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const message = validate();
    if (message) {
      event.preventDefault();
      setClientError(message);
      return;
    }
    setClientError(null);
  }

  return (
    <form action={loginAction} onSubmit={onSubmit} className="space-y-5" noValidate>
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

      <label className="block">
        <span className="field-label">Email</span>
        <input
          className={`field mt-1.5 ${clientError && !email.trim() ? "field-error" : ""}`}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (clientError) setClientError(null);
          }}
        />
      </label>

      <div>
        <span className="field-label">Password</span>
        <div className="relative mt-1.5">
          <input
            className="field pr-20"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (clientError) setClientError(null);
            }}
            aria-label="Password"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 text-xs font-semibold text-stone-500 hover:text-stone-800"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {sessionMessage ? <Alert variant="warning">{sessionMessage}</Alert> : null}
      {clientError ? <Alert variant="error">{clientError}</Alert> : null}
      {!clientError && decodedError ? <Alert variant="error">{decodedError}</Alert> : null}

      <SubmitButton className="w-full" disabled={!canSubmit} pendingLabel="Signing in…">
        Sign in
      </SubmitButton>

      <div className="border-t border-stone-100 pt-4">
        <button
          type="button"
          className="text-sm font-medium text-stone-500 hover:text-stone-800"
          onClick={() => setShowDemo((value) => !value)}
        >
          {showDemo ? "Hide demo accounts" : "Show demo accounts"}
        </button>
        {showDemo ? (
          <div className="mt-3 space-y-1 rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
            <p className="font-medium text-stone-700">Password for all accounts: demo123</p>
            {DEMO_ACCOUNTS.map((account) => (
              <p key={account.email}>
                {account.role}: {account.email}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </form>
  );
}
