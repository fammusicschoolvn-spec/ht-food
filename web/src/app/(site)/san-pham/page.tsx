import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ContactButtons } from "@/components/contact-buttons";
import { ProductGrid } from "@/components/product-card";
import { childrenOf, familyIds, parentOf, topLevel } from "@/lib/categories";
import { getCatalog, inTier, PRICE_TIERS } from "@/lib/data";
import { slugify } from "@/lib/format";

export const metadata: Metadata = {
  title: "Sản phẩm",
  description: "Giỏ quà, hộp quà trái cây nhập khẩu và bánh kẹo ngoại của HT Food, xem theo danh mục và mức giá.",
};

type Search = PageProps<"/san-pham">["searchParams"];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function href(dm: string, gia: string, tim = "") {
  const q = new URLSearchParams();
  if (tim) q.set("q", tim);
  if (dm) q.set("dm", dm);
  if (gia) q.set("gia", gia);
  const s = q.toString();
  return s ? `/san-pham?${s}` : "/san-pham";
}

async function Listing({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const { products, categories, content } = await getCatalog();
  const category = categories.find((c) => c.slug === one(sp.dm));
  const tier = PRICE_TIERS.find((t) => t.id === one(sp.gia));
  const dm = category?.slug ?? "";
  const gia = tier?.id ?? "";

  const tim = one(sp.q).trim().slice(0, 60);
  // So khớp không dấu: gõ "gio hoa" vẫn ra "Giỏ hoa".
  const needle = slugify(tim);
  // Chọn nhóm lớn thì gồm cả sản phẩm của các danh mục con.
  const ids = category ? familyIds(categories, category) : [];
  const group = category ? (parentOf(categories, category) ?? category) : undefined;
  const subs = group ? childrenOf(categories, group.id) : [];
  const list = products.filter(
    (p) =>
      (!category || ids.includes(p.categoryId)) &&
      inTier(p, gia) &&
      (!needle || slugify(`${p.name} ${p.description}`).includes(needle)),
  );
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name;
  const emptyCategory = category && !products.some((p) => ids.includes(p.categoryId));

  return (
    <>
      <header className="border-b border-line bg-ivory/60">
        <div className="container-x py-14 lg:py-20">
          <p className="eyebrow text-gold-deep">Sản phẩm</p>
          <h1 className="display mt-4 text-[clamp(2.3rem,5vw,3.8rem)] leading-[1.05]">
            {tim ? `Kết quả cho “${tim}”` : (category?.name ?? "Tất cả sản phẩm")}
          </h1>
          <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-muted">
            {category ? category.description : "Giỏ quà, hộp quà trái cây nhập khẩu, bánh kẹo và đồ uống ngoại đang có tại HT Food."}
          </p>
        </div>
      </header>

      <div className="container-x py-10 lg:py-14">
        <div className="space-y-4">
          <nav aria-label="Lọc theo danh mục" className="flex flex-wrap items-center gap-2">
            <Link href={href("", gia, tim)} className={`chip ${dm ? "" : "chip-on"}`} aria-current={dm ? undefined : "true"}>
              Tất cả
            </Link>
            {topLevel(categories).map((c) => (
              <Link
                key={c.id}
                href={href(c.slug, gia, tim)}
                className={`chip ${group?.id === c.id ? "chip-on" : ""}`}
                aria-current={group?.id === c.id ? "true" : undefined}
              >
                {c.name}
              </Link>
            ))}
          </nav>
          {group && subs.length > 0 && (
            <nav aria-label={`Danh mục con của ${group.name}`} className="flex flex-wrap items-center gap-2 border-l-2 border-gold pl-4">
              <Link
                href={href(group.slug, gia, tim)}
                className={`chip ${dm === group.slug ? "chip-on" : ""}`}
                aria-current={dm === group.slug ? "true" : undefined}
              >
                Tất cả {group.name}
              </Link>
              {subs.map((c) => (
                <Link
                  key={c.id}
                  href={href(c.slug, gia, tim)}
                  className={`chip ${dm === c.slug ? "chip-on" : ""}`}
                  aria-current={dm === c.slug ? "true" : undefined}
                >
                  {c.name}
                </Link>
              ))}
            </nav>
          )}
          <nav aria-label="Lọc theo mức giá" className="flex flex-wrap items-center gap-2">
            <Link href={href(dm, "", tim)} className={`chip ${gia ? "" : "chip-on"}`} aria-current={gia ? undefined : "true"}>
              Mọi mức giá
            </Link>
            {PRICE_TIERS.map((t) => (
              <Link
                key={t.id}
                href={href(dm, t.id, tim)}
                className={`chip ${gia === t.id ? "chip-on" : ""}`}
                aria-current={gia === t.id ? "true" : undefined}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-8 text-sm text-muted" role="status">
          {list.length} sản phẩm
          {tim && (
            <>
              {" · "}
              <Link href={href(dm, gia)} className="font-semibold text-forest-600 underline underline-offset-4">
                Bỏ tìm kiếm
              </Link>
            </>
          )}
        </p>

        {list.length > 0 ? (
          <div className="mt-6">
            <ProductGrid products={list} categoryName={categoryName} />
          </div>
        ) : (
          <div className="mt-6 rounded-[26px] border border-line bg-white/70 px-6 py-16 text-center">
            <h2 className="font-display text-[1.7rem]">
              {emptyCategory ? category.name : tim ? "Chưa tìm thấy mẫu phù hợp" : "Chưa có mẫu ở mức giá này"}
            </h2>
            <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">
              {emptyCategory
                ? content.candy.body
                : "Thử từ khóa hoặc mức giá khác, hoặc nhắn HT Food để cửa hàng làm mẫu theo ý bạn."}
            </p>
            <div className="mt-8 flex justify-center">
              <ContactButtons shop={content.shop} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function ProductsPage({ searchParams }: PageProps<"/san-pham">) {
  return (
    <Suspense fallback={<div className="min-h-[70vh] bg-ivory/60" aria-busy="true" />}>
      <Listing searchParams={searchParams} />
    </Suspense>
  );
}
