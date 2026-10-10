import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { logout } from "@/lib/actions";

export const metadata: Metadata = {
  title: { default: "Quản trị", template: "%s | Quản trị HT Food" },
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/san-pham", label: "Sản phẩm" },
  { href: "/admin/danh-muc", label: "Danh mục" },
  { href: "/admin/noi-dung", label: "Nội dung & liên hệ" },
];

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#f6f4ec] lg:flex-row">
      <aside className="bg-forest-950 text-cream lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0">
        <div className="flex items-center justify-between gap-4 px-5 py-4 lg:block lg:px-6 lg:py-8">
          <Link href="/admin" className="flex items-center gap-3">
            <Image src="/brand/mark-cream.png" alt="" width={400} height={280} className="h-8 w-auto" />
            <span className="font-display text-xl">HT Food</span>
          </Link>
          <p className="eyebrow text-gold lg:mt-3">Quản trị</p>
        </div>
        <nav aria-label="Quản trị" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-11 shrink-0 items-center rounded-lg px-3 text-[0.95rem] font-medium text-cream/85 transition-colors duration-150 hover:bg-forest-800 hover:text-gold-soft"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/"
            target="_blank"
            className="flex min-h-11 shrink-0 items-center rounded-lg px-3 text-[0.95rem] font-medium text-cream/60 transition-colors duration-150 hover:bg-forest-800 hover:text-gold-soft lg:mt-6"
          >
            Xem website ↗
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex min-h-11 w-full shrink-0 cursor-pointer items-center rounded-lg px-3 text-[0.95rem] font-medium text-cream/60 transition-colors duration-150 hover:bg-forest-800 hover:text-gold-soft"
            >
              Đăng xuất
            </button>
          </form>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <div className="mx-auto max-w-4xl">
          <Suspense fallback={<p className="text-muted">Đang tải…</p>}>{children}</Suspense>
        </div>
      </main>
    </div>
  );
}
