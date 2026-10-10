import type { Metadata } from "next";
import { Suspense } from "react";
import { BoxBuilder } from "@/components/box-builder";
import { getCatalog, PRICE_TIERS } from "@/lib/data";
import { safeUrl, telHref } from "@/lib/format";

export const metadata: Metadata = {
  title: "Tự chọn hộp quà",
  description: "Tự chọn kiểu hộp, mức ngân sách và loại trái cây, bánh kẹo cho hộp quà của bạn, rồi gửi HT Food qua Zalo.",
};

type Props = PageProps<"/tu-chon-hop-qua">;

const BUDGETS = [...PRICE_TIERS.map((t) => t.label), "Nhờ HT Food tư vấn"];

/** `?mau=<slug>`: khách bấm "tự chọn theo mẫu này" từ trang sản phẩm. */
async function Builder({ searchParams }: Pick<Props, "searchParams">) {
  const { mau } = await searchParams;
  const { products, content } = await getCatalog();
  const slug = Array.isArray(mau) ? mau[0] : mau;
  const reference = products.find((p) => p.slug === slug)?.name ?? "";
  return (
    <BoxBuilder
      styles={content.box.styles}
      items={content.box.items}
      budgets={BUDGETS}
      reference={reference}
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
        <div className="container-x py-14 lg:py-20">
          <p className="eyebrow text-gold-deep">Tự chọn hộp quà</p>
          <h1 className="display mt-4 max-w-3xl text-[clamp(2.3rem,5vw,3.8rem)] leading-[1.05] text-balance">{content.box.title}</h1>
          <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-muted">{content.box.intro}</p>
        </div>
      </header>
      <div className="container-x py-10 lg:py-16">
        <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
          <Builder searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
