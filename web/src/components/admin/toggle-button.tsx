"use client";

import { useFormStatus } from "react-dom";
import { toggleProduct } from "@/lib/actions";

function Inner({ on, onText, offText }: { on: boolean; onText: string; offText: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-pressed={on}
      disabled={pending}
      className={`a-btn min-h-9 px-3 text-xs ${on ? "bg-sage text-forest-800 hover:bg-forest-800 hover:text-white" : "a-btn-ghost text-muted"}`}
    >
      {pending ? "Đang lưu…" : on ? onText : offText}
    </button>
  );
}

/** Nút bật/tắt Hiện hoặc Nổi bật của một sản phẩm. */
export function ToggleButton({ id, field, on, onText, offText }: { id: string; field: string; on: boolean; onText: string; offText: string }) {
  return (
    <form action={toggleProduct}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="field" value={field} />
      <Inner on={on} onText={onText} offText={offText} />
    </form>
  );
}
