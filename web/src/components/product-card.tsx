import Link from "next/link";
import { ProductImage } from "./product-image";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  category,
  priority = false,
}: {
  product: Product;
  category?: string;
  priority?: boolean;
}) {
  const src = product.thumb || product.images[0];
  const remote = Boolean(src?.startsWith("http"));
  return (
    <Link href={`/san-pham/${product.slug}`} className="group block">
      <div className={`relative aspect-[4/5] overflow-hidden rounded-[22px] ${remote ? "bg-white" : "bg-ivory"}`}>
        <ProductImage
          src={src}
          alt={product.name}
          priority={priority}
          sizes="(min-width: 1024px) 290px, (min-width: 640px) 33vw, 50vw"
          className={`${remote ? "object-contain p-3" : "object-cover"} transition-transform duration-700 ease-out-soft group-hover:scale-[1.04]`}
        />
      </div>
      <div className="mt-4 px-1">
        {category && <p className="eyebrow truncate text-muted">{category}</p>}
        {/* Luôn chừa đủ hai dòng tên để giá của cả hàng nằm thẳng nhau. */}
        <h3 className="mt-2 line-clamp-2 min-h-[2.75em] font-display text-[1.2rem] leading-[1.375] text-ink transition-colors duration-200 group-hover:text-forest-600">
          {product.name}
        </h3>
        <p className="mt-2 text-[0.95rem] font-semibold text-gold-deep">{product.priceLabel}</p>
      </div>
    </Link>
  );
}

export function ProductGrid({
  products,
  categoryName,
}: {
  products: Product[];
  categoryName: (id: string) => string | undefined;
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} category={categoryName(p.categoryId)} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
