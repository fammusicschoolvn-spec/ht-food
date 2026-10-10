"use client";

import { useActionState } from "react";
import { login, type FormState } from "@/lib/actions";
import { FormMessage, SubmitButton } from "./form-bits";

export function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action} className="mt-7 space-y-5">
      <div>
        <label htmlFor="password" className="a-label">
          Mật khẩu
        </label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="a-input" />
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingText="Đang đăng nhập…" className="a-btn a-btn-primary w-full">
        Đăng nhập
      </SubmitButton>
    </form>
  );
}
