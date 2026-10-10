import type { Metadata } from "next";
import { Suspense } from "react";
import { BasketBuilder } from "@/components/basket-builder";
import { parseBaskets, parseFruits } from "@/lib/builder";
import { getCatalog } from "@/lib/data";
import { safeUrl, telHref } from "@/lib/format";

export const metadata: Metadata = {
  title: "Tự xếp giỏ quà",
  description: "Tự tay xếp giỏ trái cây: chọn kiểu giỏ, kéo trái cây vào giỏ, xem tổng tiền ngay và đặt nhiều giỏ cho doanh nghiệp.",
};

type Props = PageProps<"/tu-chon-hop-qua">;

/** `?mau=<slug>`: khách bấm "tự xếp theo mẫu này" từ trang sản phẩm. */
async function Builder({ searchParams }: Pick<Props, "searchParams">) {
  const { mau } = await searchParams;
  const { products, content } = await getCatalog();
  const slug = Array.isArray(mau) ? mau[0] : mau;
  const baskets = parseBaskets(content.box.baskets);
  const fruits = parseFruits(content.box.fruits);
  if (baskets.length === 0 || fruits.length === 0) {
    return <p className="text-muted">Tính năng đang được cập nhật. Vui lòng nhắn Zalo cho HT Food để đặt giỏ quà.</p>;
  }
  return (
    <BasketBuilder
      baskets={baskets}
      fruits={fruits}
      priceNote={content.box.priceNote}
      reference={products.find((p) => p.slug === slug)?.name ?? ""}
      zalo={safeUrl(content.shop.zalo)}
      phone={content.shop.phone}
      phoneHref={telHref(content.shop.phone)}
    />
  );
}

export default async function BoxPage({ searchParams }: Props) {
  const { content } = await getCatalog();
  return (
    <>
      <header className="border-b border-line bg-ivory/60">
        <div className="container-x py-10 lg:py-14">
          <p className="eyebrow text-gold-deep">Tự xếp giỏ quà</p>
          <h1 className="display mt-3 max-w-3xl text-[clamp(2rem,4.4vw,3.2rem)] leading-[1.08] text-balance">{content.box.title}</h1>
          <p className="mt-3 max-w-2xl text-[1.02rem] leading-relaxed text-muted">{content.box.intro}</p>
        </div>
      </header>
      <div className="container-x py-8 lg:py-12">
        <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
          <Builder searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
