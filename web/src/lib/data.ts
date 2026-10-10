import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { readDb } from "./store";
import type { Db, Product } from "./types";

export const CATALOG_TAG = "catalog";

/** Toàn bộ dữ liệu trang khách xem; làm mới ngay khi quản trị lưu thay đổi. */
export async function getCatalog(): Promise<Db> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("max");
  const db = await readDb();
  return {
    ...db,
    products: db.products
      .filter((p) => p.visible)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

export const PRICE_TIERS = [
  { id: "duoi-300", label: "Dưới 300.000đ", min: 0, max: 300_000 },
  { id: "300-500", label: "300.000 – 500.000đ", min: 300_000, max: 500_000 },
  { id: "500-1000", label: "500.000 – 1.000.000đ", min: 500_000, max: 1_000_000 },
  { id: "tu-1000", label: "Từ 1.000.000đ", min: 1_000_000, max: Infinity },
] as const;

export function inTier(p: Product, tierId: string): boolean {
  const tier = PRICE_TIERS.find((t) => t.id === tierId);
  return tier ? p.priceMin >= tier.min && p.priceMin < tier.max : true;
}
