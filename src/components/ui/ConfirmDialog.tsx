"use client";

import { useState } from "react";

export function ConfirmDialog({
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={onCancel}>
      <div
        className="w-full max-w-sm overflow-hidden rounded bg-white shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="px-5 py-4">
          <p className="text-sm font-semibold text-stone-900">Confirm</p>
          <p className="mt-1 text-sm text-stone-600">{message}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-stone-200 px-5 py-3">
          <button className="btn btn-ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const [pending, setPending] = useState<{
    message: string;
    confirmLabel?: string;
    resolve: (ok: boolean) => void;
  } | null>(null);

  function confirm(message: string, confirmLabel?: string) {
    return new Promise<boolean>((resolve) => {
      setPending({ message, confirmLabel, resolve });
    });
  }

  const dialog = pending ? (
    <ConfirmDialog
      message={pending.message}
      confirmLabel={pending.confirmLabel}
      onConfirm={() => {
        pending.resolve(true);
        setPending(null);
      }}
      onCancel={() => {
        pending.resolve(false);
        setPending(null);
      }}
    />
  ) : null;

  return { confirm, dialog };
}
