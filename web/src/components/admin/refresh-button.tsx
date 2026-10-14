"use client";

import { useActionState } from "react";
import { refreshCatalog, type FormState } from "@/lib/actions";
import { FormMessage, SubmitButton } from "./form-bits";

export function RefreshButton() {
  const [state, action] = useActionState<FormState, FormData>(refreshCatalog, {});
  return (
    <form action={action} className="a-card flex flex-wrap items-center justify-between gap-4">
      <div className="max-w-xl">
        <h2 className="font-display text-[1.4rem]">Làm mới dữ liệu</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Bấm sau khi nhập file Excel mới hoặc khi trang khách chưa hiện thay đổi. Sửa trong trang quản trị thì không cần bấm.
        </p>
        <div className="mt-3">
          <FormMessage state={state} />
        </div>
      </div>
      <SubmitButton pendingText="Đang làm mới…">Làm mới trang khách</SubmitButton>
    </form>
  );
}
