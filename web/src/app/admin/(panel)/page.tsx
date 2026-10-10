import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { readDb } from "@/lib/store";

export default async function AdminHome() {
  await requireAdmin();
  const { products, categories, content } = await readDb();

  const stats = [
    { label: "Sản phẩm", value: products.length },
    { label: "Đang hiện", value: products.filter((p) => p.visible).length },
    { label: "Mẫu nổi bật", value: products.filter((p) => p.featured).length },
    { label: "Danh mục", value: categories.length },
  ];

  const emptyCategories = categories.filter((c) => c.parentId && !products.some((p) => p.categoryId === c.id && p.visible));
  const todo = [
    !content.shop.facebook && { text: "Chưa có đường dẫn Facebook.", href: "/admin/noi-dung" },
    !content.shop.messenger && { text: "Chưa có đường dẫn Messenger.", href: "/admin/noi-dung" },
    !content.shop.hours && { text: "Chưa có giờ mở cửa.", href: "/admin/noi-dung" },
    emptyCategories.length > 0 && {
      text: `${emptyCategories.length} danh mục con chưa có sản phẩm nào.`,
      href: "/admin/san-pham/moi",
    },
  ].filter((x): x is { text: string; href: string } => Boolean(x));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-[2.2rem] leading-tight">Tổng quan</h1>
        <Link href="/admin/san-pham/moi" className="a-btn a-btn-primary">
          Đăng sản phẩm mới
        </Link>
      </div>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="a-card">
            <dt className="text-sm font-medium text-muted">{s.label}</dt>
            <dd className="mt-2 font-display text-[2.4rem] leading-none text-forest-800">{s.value}</dd>
          </div>
        ))}
      </dl>

      {todo.length > 0 && (
        <section className="a-card">
          <h2 className="font-display text-[1.4rem]">Việc nên bổ sung</h2>
          <ul className="mt-4 divide-y divide-line">
            {todo.map((t) => (
              <li key={t.text} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>{t.text}</span>
                <Link href={t.href} className="a-btn a-btn-ghost">
                  Bổ sung
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
