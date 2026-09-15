"use client";

import { useConfirm } from "@/components/ui/ConfirmDialog";

export function ConfirmForm({
  action,
  message,
  confirmLabel,
  className,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  message: string;
  confirmLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { confirm, dialog } = useConfirm();

  return (
    <>
      {dialog}
      <form
        className={className}
        action={async (formData) => {
          const ok = await confirm(message, confirmLabel);
          if (!ok) return;
          await action(formData);
        }}
      >
        {children}
      </form>
    </>
  );
}
