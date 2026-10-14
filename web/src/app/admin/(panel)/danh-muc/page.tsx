import type { Metadata } from "next";
import { CategoryForm } from "@/components/admin/category-forms";
import { requireAdmin } from "@/lib/auth";
import { childrenOf, topLevel } from "@/lib/categories";
import { productStats, readCategories } from "@/lib/store";
import type { Category } from "@/lib/types";

export const metadata: Metadata = { title: "Danh mục" };

export default async function AdminCategories() {
  await requireAdmin();
  const [categories, stats] = await Promise.all([readCategories(), productStats()]);
  const groups = topLevel(categories);
  const count = (id: string) => stats.byCategory[id]?.all ?? 0;

  const row = (c: Category, kids: number) => (
    <details key={c.id} className="group border-t border-line first:border-0">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-2 [&::-webkit-details-marker]:hidden">
        <span className={c.parentId ? "pl-5 text-[0.98rem]" : "font-semibold"}>{c.name}</span>
        <span className="flex shrink-0 items-center gap-3 text-sm text-muted">
          {kids > 0 && <span>{kids} danh mục con</span>}
          <span>{count(c.id)} sản phẩm</span>
          <span className="font-semibold text-forest-700 group-open:hidden">Sửa</span>
          <span className="hidden font-semibold text-forest-700 group-open:inline">Đóng</span>
        </span>
      </summary>
      <div className="mb-4 rounded-xl bg-[#f6f4ec] p-4 sm:p-5">
        <CategoryForm category={c} groups={groups} count={count(c.id)} hasChildren={kids > 0} />
      </div>
    </details>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[2.2rem] leading-tight">Danh mục</h1>
        <p className="mt-1 text-sm text-muted">
          {groups.length} nhóm lớn, {categories.length - groups.length} danh mục con. Bấm vào một dòng để sửa.
        </p>
      </div>

      {groups.map((g) => {
        const kids = childrenOf(categories, g.id);
        return (
          <section key={g.id} className="a-card py-2 sm:py-3">
            {row(g, kids.length)}
            {kids.map((k) => row(k, 0))}
          </section>
        );
      })}

      <section className="a-card">
        <h2 className="mb-5 font-display text-[1.4rem]">Thêm danh mục</h2>
        <CategoryForm groups={groups} />
      </section>
    </div>
  );
}
