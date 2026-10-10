import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Sửa sản phẩm" };

export default async function EditProduct({ params }: PageProps<"/admin/san-pham/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { products, categories } = await readDb();
  const product = products.find((p) => p.id === id);
  if (!product) notFound();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-[2.2rem] leading-tight">Sửa sản phẩm</h1>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
