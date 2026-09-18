"use client";

import { useState } from "react";
import { changePasswordAction } from "@/lib/actions/auth";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function AccountSettingsForm({
  name,
  email,
  roleLabel = "Owner",
  error,
  updated,
}: {
  name: string;
  email: string;
  roleLabel?: string;
  error?: string;
  updated?: boolean;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const errors: typeof fieldErrors = {};
    if (!currentPassword.trim()) errors.currentPassword = "Current password is required.";
    if (newPassword.length < 8) errors.newPassword = "New password must be at least 8 characters.";
    if (newPassword && newPassword !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
    if (Object.keys(errors).length > 0) {
      event.preventDefault();
      setFieldErrors(errors);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="card p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">{roleLabel}</p>
        <h2 className="mt-2 text-xl font-semibold">{name}</h2>
        <p className="mt-1 text-sm text-stone-500">{email}</p>
      </div>

      <form action={changePasswordAction} onSubmit={onSubmit} className="card p-6" noValidate>
        <h2 className="text-lg font-semibold">Change password</h2>
        <p className="mt-1 text-sm text-stone-500">Use a unique password that you do not share with other accounts.</p>

        {updated ? (
          <div className="mt-4">
            <Alert variant="success">Password updated successfully.</Alert>
          </div>
        ) : null}
        {error ? (
          <div className="mt-4">
            <Alert variant="error">{decodeURIComponent(error.replaceAll("+", " "))}</Alert>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4">
          <label className="block">
            <span className="field-label">Current password</span>
            <input
              className={`field mt-1.5 ${fieldErrors.currentPassword ? "field-error" : ""}`}
              type="password"
              name="currentPassword"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value);
                setFieldErrors((prev) => ({ ...prev, currentPassword: undefined }));
              }}
            />
            {fieldErrors.currentPassword ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.currentPassword}</p>
            ) : null}
          </label>
          <div>
            <label className="block">
              <span className="field-label">New password</span>
              <input
                className={`field mt-1.5 ${fieldErrors.newPassword ? "field-error" : ""}`}
                type="password"
                name="newPassword"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
                }}
              />
            </label>
            {fieldErrors.newPassword ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.newPassword}</p>
            ) : (
              <p className="mt-1 text-xs text-stone-500">Must be at least 8 characters.</p>
            )}
          </div>
          <label className="block">
            <span className="field-label">Confirm new password</span>
            <input
              className={`field mt-1.5 ${fieldErrors.confirmPassword ? "field-error" : ""}`}
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
            />
            {fieldErrors.confirmPassword ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
            ) : null}
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <SubmitButton pendingLabel="Updating…">Update password</SubmitButton>
        </div>
      </form>
    </div>
  );
}
