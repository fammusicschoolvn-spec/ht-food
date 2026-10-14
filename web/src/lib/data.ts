import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { familyIds } from "./categories";
import { productBySlug, queryProducts, readCategories, readContent, visibleIndex } from "./store";
import type { Category, Content, Product } from "./types";

export const CATALOG_TAG = "catalog";

// Trang khách chỉ hỏi đúng phần cần hiện (vài chục món), mỗi phần lưu đệm riêng.
// Quản trị lưu thay đổi thì gọi updateTag(CATALOG_TAG) để làm mới tất cả.

export const PRICE_TIERS = [
  { id: "duoi-300", label: "Dưới 300.000đ", min: 0, max: 300_000 },
  { id: "300-500", label: "300.000 – 500.000đ", min: 300_000, max: 500_000 },
  { id: "500-1000", label: "500.000 – 1.000.000đ", min: 500_000, max: 1_000_000 },
  { id: "tu-1000", label: "Từ 1.000.000đ", min: 1_000_000, max: Infinity },
] as const;

const inTierPrice = (price: number, tierId: string) => {
  const tier = PRICE_TIERS.find((t) => t.id === tierId);
  return tier ? price >= tier.min && price < tier.max : true;
};

export function inTier(p: Product, tierId: string): boolean {
  return inTierPrice(p.priceMin, tierId);
}

/** Danh mục và nội dung trang (menu, chân trang, chữ trang chủ). */
export async function getSite(): Promise<{ categories: Category[]; content: Content }> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("max");
  const [categories, content] = await Promise.all([readCategories(), readContent()]);
  return { categories, content };
}

/** Số món đang hiện: tổng, theo từng danh mục, theo từng mức giá. */
export async function getCounts(): Promise<{ total: number; byCategory: Record<string, number>; byTier: Record<string, number> }> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("max");
  const rows = await visibleIndex();
  const byCategory: Record<string, number> = {};
  const byTier: Record<string, number> = {};
  for (const r of rows) {
    byCategory[r.categoryId] = (byCategory[r.categoryId] ?? 0) + 1;
    for (const t of PRICE_TIERS) if (inTierPrice(r.priceMin, t.id)) byTier[t.id] = (byTier[t.id] ?? 0) + 1;
  }
  return { total: rows.length, byCategory, byTier };
}

/** Mẫu nổi bật cho trang chủ; chưa đủ 4 mẫu thì lấy các món mới nhất. */
export async function getShowcase(): Promise<Product[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("max");
  const featured = await queryProducts({ visibleOnly: true, featuredOnly: true, page: 1, perPage: 8 });
  if (featured.items.length >= 4) return featured.items;
  return (await queryProducts({ visibleOnly: true, page: 1, perPage: 8 })).items;
}

/** Ảnh đầu tiên của một món trong mỗi nhóm lớn (khi nhóm chưa có ảnh đại diện). */
export async function getGroupCover(categoryIds: string[]): Promise<string> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("max");
  const { items } = await queryProducts({ visibleOnly: true, categoryIds, page: 1, perPage: 1 });
  return items[0]?.thumb || items[0]?.images[0] || "";
}

export async function getListing(f: { categoryIds: string[]; tierId: string; q: string; page: number; perPage: number }) {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  const tier = PRICE_TIERS.find((t) => t.id === f.tierId);
  return queryProducts({
    visibleOnly: true,
    categoryIds: f.categoryIds,
    q: f.q,
    minPrice: tier?.min,
    maxPrice: tier && Number.isFinite(tier.max) ? tier.max : undefined,
    page: f.page,
    perPage: f.perPage,
  });
}

/** Một sản phẩm đang hiện theo đường dẫn; món đang ẩn coi như không có. */
export async function getProduct(slug: string): Promise<Product | null> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("max");
  const p = await productBySlug(slug);
  return p && p.visible ? p : null;
}

/** Mẫu cùng danh mục, giá gần nhất với món đang xem. */
export async function getRelated(product: Product): Promise<Product[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("max");
  const { items } = await queryProducts({ visibleOnly: true, categoryIds: [product.categoryId], page: 1, perPage: 40 });
  return items
    .filter((p) => p.id !== product.id)
    .sort((a, b) => Math.abs(a.priceMin - product.priceMin) - Math.abs(b.priceMin - product.priceMin))
    .slice(0, 4);
}

export { familyIds };
