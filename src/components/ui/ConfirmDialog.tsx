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
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="bg-[#14110e] px-6 py-5 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400">Confirm</p>
          <p className="mt-2 text-lg">{message}</p>
        </div>
        <div className="flex justify-end gap-3 border-t border-stone-100 px-6 py-4">
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
