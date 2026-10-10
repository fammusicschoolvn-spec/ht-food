"use client";

import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/actions";

export function SubmitButton({
  children,
  pendingText = "Đang lưu…",
  className = "a-btn a-btn-primary",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger">
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p role="status" className="rounded-lg border border-forest-600/30 bg-sage/60 px-4 py-3 text-sm font-medium text-forest-800">
        {state.ok}
      </p>
    );
  }
  return null;
}

/** Nút xóa có hỏi lại trước khi gửi. */
export function ConfirmButton({
  children,
  message,
  className = "a-btn a-btn-danger",
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
