import type { Metadata } from "next";
import Link from "next/link";
import { Pager } from "@/components/pager";
import { ProductImage } from "@/components/product-image";
import { requireAdmin } from "@/lib/auth";
import { familyIds, fullName, topLevel, childrenOf } from "@/lib/categories";
import { adminProducts, productTotals, readCategories } from "@/lib/store";
import { ToggleButton } from "@/components/admin/toggle-button";

export const metadata: Metadata = { title: "Sản phẩm" };

const PER_PAGE = 50;

const FILTERS = [
  { id: "", label: "Tất cả" },
  { id: "hien", label: "Đang hiện" },
  { id: "an", label: "Đang ẩn" },
  { id: "thieu-anh", label: "Chưa có ảnh" },
  { id: "noi-bat", label: "Nổi bật" },
] as const;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AdminProducts({ searchParams }: PageProps<"/admin/san-pham">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 80);
  const dm = one(sp.dm);
  const loc = FILTERS.some((f) => f.id === one(sp.loc)) ? one(sp.loc) : "";
  const page = Math.max(1, Math.floor(Number(one(sp.trang)) || 1));
  const [categories, stats] = await Promise.all([readCategories(), productTotals()]);
  const category = categories.find((c) => c.id === dm);
  const { items: shown, total } = await adminProducts({
    q,
    categoryIds: category ? familyIds(categories, category) : [],
    loc,
    page,
    perPage: PER_PAGE,
  });
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  const href = (patch: Record<string, string | number>) => {
    const params = new URLSearchParams();
    const all = { q, dm, loc, trang: 1, ...patch };
    for (const [k, v] of Object.entries(all)) if (v && !(k === "trang" && Number(v) <= 1)) params.set(k, String(v));
    const s = params.toString();
    return s ? `/admin/san-pham?${s}` : "/admin/san-pham";
  };
  const categoryName = (id: string) => {
    const c = categories.find((x) => x.id === id);
    return c ? fullName(categories, c) : "Chưa có danh mục";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[2.2rem] leading-tight">Sản phẩm</h1>
          <p className="mt-1 text-sm text-muted">
            {stats.total.toLocaleString("vi-VN")} sản phẩm, {stats.visible.toLocaleString("vi-VN")} đang hiện trên web.
          </p>
        </div>
        <Link href="/admin/san-pham/moi" className="a-btn a-btn-primary">
          Đăng sản phẩm mới
        </Link>
      </div>

      <form action="/admin/san-pham" className="a-card grid gap-4 p-4 sm:grid-cols-[1fr_16rem_auto] sm:items-end sm:p-5">
        <input type="hidden" name="loc" value={loc} />
        <div>
          <label htmlFor="q" className="a-label">
            Tìm theo tên hoặc mã hàng
          </label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Ví dụ: táo envy, SP1111…" className="a-input" />
        </div>
        <div>
          <label htmlFor="dm" className="a-label">
            Danh mục
          </label>
          <select id="dm" name="dm" defaultValue={dm} className="a-input">
            <option value="">Tất cả danh mục</option>
            {topLevel(categories).map((g) => (
              <optgroup key={g.id} label={g.name}>
                <option value={g.id}>Tất cả {g.name}</option>
                {childrenOf(categories, g.id).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <button type="submit" className="a-btn a-btn-primary">
          Lọc
        </button>
      </form>

      <nav aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={href({ loc: f.id })}
            aria-current={loc === f.id ? "true" : undefined}
            className={`a-btn min-h-10 px-4 text-sm ${loc === f.id ? "a-btn-primary" : "a-btn-ghost"}`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <p className="text-sm text-muted" role="status">
        {total.toLocaleString("vi-VN")} sản phẩm khớp{pages > 1 && ` · trang ${page}/${pages}`}
      </p>

      <ul className="space-y-3">
        {shown.map((p) => (
          <li key={p.id} className="a-card flex flex-wrap items-center gap-4 p-4 sm:p-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-white">
              <ProductImage src={p.thumb || p.images[0]} alt="" sizes="64px" className="object-contain" />
            </div>
            <div className="min-w-0 flex-1 basis-48">
              <p className="truncate font-semibold">{p.name}</p>
              <p className="mt-0.5 text-sm text-muted">
                {p.code && <span className="tabular-nums">{p.code} · </span>}
                {categoryName(p.categoryId)} · {p.priceLabel}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ToggleButton id={p.id} field="visible" on={p.visible} onText="Đang hiện" offText="Đang ẩn" />
              <ToggleButton id={p.id} field="featured" on={p.featured} onText="Nổi bật" offText="Thường" />
              <Link href={`/admin/san-pham/${p.id}`} className="a-btn a-btn-ghost min-h-9 px-3 text-xs">
                Sửa
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <Pager page={page} pages={pages} href={(n) => href({ trang: n })} />
    </div>
  );
}
