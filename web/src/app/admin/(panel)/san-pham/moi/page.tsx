import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth";
import { readCategories } from "@/lib/store";

export const metadata: Metadata = { title: "Đăng sản phẩm" };

export default async function NewProduct() {
  await requireAdmin();
  const categories = await readCategories();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-[2.2rem] leading-tight">Đăng sản phẩm mới</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
