import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { toggleProduct } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { fullName } from "@/lib/categories";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Sản phẩm" };

function Toggle({ id, field, on, onText, offText }: { id: string; field: string; on: boolean; onText: string; offText: string }) {
  return (
    <form action={toggleProduct}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="field" value={field} />
      <button
        type="submit"
        aria-pressed={on}
        className={`a-btn min-h-9 px-3 text-xs ${on ? "bg-sage text-forest-800 hover:bg-forest-800 hover:text-white" : "a-btn-ghost text-muted"}`}
      >
        {on ? onText : offText}
      </button>
    </form>
  );
}

export default async function AdminProducts() {
  await requireAdmin();
  const { products, categories } = await readDb();
  const sorted = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const categoryName = (id: string) => {
    const c = categories.find((x) => x.id === id);
    return c ? fullName(categories, c) : "Chưa có danh mục";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[2.2rem] leading-tight">Sản phẩm</h1>
          <p className="mt-1 text-sm text-muted">{products.length} sản phẩm, mới nhất ở trên.</p>
        </div>
        <Link href="/admin/san-pham/moi" className="a-btn a-btn-primary">
          Đăng sản phẩm mới
        </Link>
      </div>

      <ul className="space-y-3">
        {sorted.map((p) => (
          <li key={p.id} className="a-card flex flex-wrap items-center gap-4 p-4 sm:p-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-ivory">
              {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="64px" className="object-cover object-bottom" />}
            </div>
            <div className="min-w-0 flex-1 basis-48">
              <p className="truncate font-semibold">{p.name}</p>
              <p className="mt-0.5 text-sm text-muted">
                {categoryName(p.categoryId)} · {p.priceLabel}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Toggle id={p.id} field="visible" on={p.visible} onText="Đang hiện" offText="Đang ẩn" />
              <Toggle id={p.id} field="featured" on={p.featured} onText="Nổi bật" offText="Thường" />
              <Link href={`/admin/san-pham/${p.id}`} className="a-btn a-btn-ghost min-h-9 px-3 text-xs">
                Sửa
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
