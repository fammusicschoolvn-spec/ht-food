import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { isAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Đăng nhập quản trị",
  robots: { index: false, follow: false },
};

async function AlreadyIn() {
  if (await isAdmin()) redirect("/admin");
  return null;
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-forest-900 px-5 py-16">
      <Suspense>
        <AlreadyIn />
      </Suspense>
      <div className="w-full max-w-sm rounded-3xl bg-cream p-8 sm:p-10">
        <Image src="/brand/logo-green.png" alt="HT Food" width={900} height={734} className="mx-auto h-24 w-auto" priority />
        <h1 className="mt-6 text-center font-display text-[1.7rem]">Trang quản trị</h1>
        <LoginForm />
      </div>
    </main>
  );
}
