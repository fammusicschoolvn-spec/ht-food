import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContactButtons } from "@/components/contact-buttons";
import { Gallery } from "@/components/gallery";
import { BoxIcon, PinIcon } from "@/components/icons";
import { PriceTag } from "@/components/price-tag";
import { ProductGrid } from "@/components/product-card";
import { parentOf } from "@/lib/categories";
import { getCatalog } from "@/lib/data";

type Props = PageProps<"/san-pham/[slug]">;

export async function generateStaticParams() {
  const { products } = await getCatalog();
  // Dựng sẵn các mẫu nổi bật; trang còn lại dựng khi có người mở lần đầu rồi lưu lại.
  return products.filter((p) => p.featured).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await getCatalog();
  const product = products.find((p) => p.slug === slug);
  if (!product) return { title: "Không tìm thấy sản phẩm" };
  return {
    title: product.name,
    description: `${product.name} – ${product.priceLabel}. ${product.description}`.slice(0, 160),
    openGraph: product.images[0] ? { images: [product.images[0]] } : undefined,
  };
}

async function Detail({ params }: Pick<Props, "params">) {
  const { slug } = await params;
  const { products, categories, content } = await getCatalog();
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const category = categories.find((c) => c.id === product.categoryId);
  const group = category && parentOf(categories, category);
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name;
  const related = products
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
    .sort((a, b) => Math.abs(a.priceMin - product.priceMin) - Math.abs(b.priceMin - product.priceMin))
    .slice(0, 4);

  return (
    <>
      <div className="container-x py-8 lg:py-14">
        <nav aria-label="Đường dẫn" className="text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/san-pham" className="inline-flex min-h-10 items-center hover:text-forest-600">
                Sản phẩm
              </Link>
            </li>
            {group && (
              <>
                <li aria-hidden>/</li>
                <li>
                  <Link href={`/san-pham?dm=${group.slug}`} className="inline-flex min-h-10 items-center hover:text-forest-600">
                    {group.name}
                  </Link>
                </li>
              </>
            )}
            {category && (
              <>
                <li aria-hidden>/</li>
                <li>
                  <Link href={`/san-pham?dm=${category.slug}`} className="inline-flex min-h-10 items-center hover:text-forest-600">
                    {category.name}
                  </Link>
                </li>
              </>
            )}
          </ol>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,560px)_1fr] lg:gap-16">
          <Gallery images={product.images} name={product.name} />

          <div className="lg:pt-6">
            {category && <p className="eyebrow text-gold-deep">{category.name}</p>}
            <h1 className="display mt-4 text-[clamp(2.1rem,4.4vw,3.4rem)] leading-[1.08] text-balance">{product.name}</h1>
            <div className="mt-7">
              <PriceTag size="lg">{product.priceLabel}</PriceTag>
            </div>

            {product.description && (
              <p className="mt-8 max-w-xl whitespace-pre-line text-[1.06rem] leading-[1.8]">{product.description}</p>
            )}
            {content.productNote && group?.slug === "gio-hop-qua" && (
              <p className="mt-5 max-w-xl border-l-2 border-gold pl-4 text-[0.95rem] leading-relaxed text-muted">
                {content.productNote}
              </p>
            )}

            <div className="mt-9">
              <ContactButtons shop={content.shop} />
            </div>
            <Link
              href={`/tu-chon-hop-qua?mau=${product.slug}`}
              className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-forest-600 underline decoration-line underline-offset-4 hover:decoration-forest-600"
            >
              <BoxIcon width={18} height={18} />
              Tự xếp giỏ quà theo mẫu này
            </Link>

            <p className="mt-9 flex gap-3 border-t border-line pt-7 text-[0.95rem] text-muted">
              <PinIcon className="mt-0.5 shrink-0 text-forest-600" />
              Nhận tại {content.shop.name}: {content.shop.address}
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="bg-ivory/60 py-16 lg:py-24">
          <div className="container-x">
            <h2 className="display text-[clamp(1.8rem,3.4vw,2.6rem)] leading-tight">Mẫu cùng danh mục</h2>
            <div className="mt-10">
              <ProductGrid products={related} categoryName={categoryName} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default function ProductPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" aria-busy="true" />}>
      <Detail params={params} />
    </Suspense>
  );
}
