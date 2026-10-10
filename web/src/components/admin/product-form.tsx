"use client";

import Link from "next/link";
import { useActionState } from "react";
import { deleteProduct, saveProduct, type FormState } from "@/lib/actions";
import { fullName } from "@/lib/categories";
import type { Category, Product } from "@/lib/types";
import { ConfirmButton, FormMessage, SubmitButton } from "./form-bits";
import { ImagePicker } from "./image-picker";

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const [state, action] = useActionState<FormState, FormData>(saveProduct, {});

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-6">
        <input type="hidden" name="id" value={product?.id ?? ""} />

        <div className="a-card space-y-6">
          <div>
            <label htmlFor="name" className="a-label">
              Tên sản phẩm
            </label>
            <input id="name" name="name" required maxLength={120} defaultValue={product?.name} className="a-input" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="categoryId" className="a-label">
                Danh mục
              </label>
              <select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? categories.find((c) => c.parentId)?.id} className="a-input">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {fullName(categories, c)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="priceLabel" className="a-label">
                Giá hiển thị
              </label>
              <input
                id="priceLabel"
                name="priceLabel"
                required
                maxLength={60}
                defaultValue={product?.priceLabel}
                placeholder="3xx.000đ"
                className="a-input"
              />
              <p className="a-help">Khách thấy đúng dòng này. Ví dụ: 3xx.000đ, 800.000 – 900.000đ.</p>
            </div>
          </div>

          <div className="sm:max-w-xs">
            <label htmlFor="priceMin" className="a-label">
              Giá thấp nhất (đồng)
            </label>
            <input
              id="priceMin"
              name="priceMin"
              inputMode="numeric"
              defaultValue={product?.priceMin || ""}
              placeholder="300000"
              className="a-input"
            />
            <p className="a-help">Chỉ dùng để xếp sản phẩm vào bộ lọc mức giá, khách không thấy.</p>
          </div>

          <div>
            <label htmlFor="description" className="a-label">
              Mô tả
            </label>
            <textarea id="description" name="description" rows={4} maxLength={4000} defaultValue={product?.description} className="a-input" />
            <p className="a-help">Gồm những loại trái cây, bánh kẹo gì, kiểu hộp, kiểu giỏ.</p>
          </div>
        </div>

        <div className="a-card">
          <p className="a-label">Hình ảnh</p>
          <p className="a-help mb-4 mt-0">Tối đa 8 ảnh. Ảnh đầu tiên hiện ở danh sách sản phẩm.</p>
          <ImagePicker name="images" initial={product?.images ?? []} multiple />
        </div>

        <div className="a-card space-y-4">
          <label className="flex min-h-11 cursor-pointer items-center gap-3">
            <input type="checkbox" name="visible" defaultChecked={product?.visible ?? true} className="size-5 accent-forest-700" />
            <span>
              <span className="font-semibold">Hiện trên website</span>
              <span className="block text-sm text-muted">Bỏ chọn để tạm ẩn khi hết hàng.</span>
            </span>
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-3">
            <input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} className="size-5 accent-forest-700" />
            <span>
              <span className="font-semibold">Mẫu nổi bật</span>
              <span className="block text-sm text-muted">Hiện ở trang chủ (tối đa 8 mẫu mới nhất).</span>
            </span>
          </label>
        </div>

        <FormMessage state={state} />

        <div className="flex flex-wrap gap-3">
          <SubmitButton>{product ? "Lưu thay đổi" : "Đăng sản phẩm"}</SubmitButton>
          <Link href="/admin/san-pham" className="a-btn a-btn-ghost">
            Hủy
          </Link>
        </div>
      </form>

      {product && (
        <form action={deleteProduct} className="a-card flex flex-wrap items-center justify-between gap-4">
          <input type="hidden" name="id" value={product.id} />
          <p className="text-sm text-muted">Xóa hẳn sản phẩm này khỏi website. Không khôi phục được.</p>
          <ConfirmButton message={`Xóa "${product.name}"? Thao tác này không khôi phục được.`}>Xóa sản phẩm</ConfirmButton>
        </form>
      )}
    </div>
  );
}
