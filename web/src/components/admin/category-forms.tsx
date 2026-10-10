"use client";

import { useActionState } from "react";
import { deleteCategory, saveCategory, type FormState } from "@/lib/actions";
import type { Category } from "@/lib/types";
import { ConfirmButton, FormMessage, SubmitButton } from "./form-bits";
import { ImagePicker } from "./image-picker";

export function CategoryForm({
  category,
  groups,
  count = 0,
  hasChildren = false,
}: {
  category?: Category;
  /** Các nhóm lớn có thể chọn làm nhóm cha. */
  groups: Category[];
  count?: number;
  hasChildren?: boolean;
}) {
  const [saved, save] = useActionState<FormState, FormData>(saveCategory, {});
  const [removed, remove] = useActionState<FormState, FormData>(deleteCategory, {});
  const key = category?.id ?? "moi";

  return (
    <div className="space-y-4">
      <form action={save} className="space-y-4">
        <input type="hidden" name="id" value={category?.id ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`name-${key}`} className="a-label">
              Tên danh mục
            </label>
            <input id={`name-${key}`} name="name" required maxLength={80} defaultValue={category?.name} className="a-input" />
          </div>
          <div>
            <label htmlFor={`parent-${key}`} className="a-label">
              Thuộc nhóm
            </label>
            {hasChildren ? (
              <p className="flex min-h-11 items-center text-sm text-muted">Đây là nhóm lớn (đang có danh mục con).</p>
            ) : (
              <select id={`parent-${key}`} name="parentId" defaultValue={category?.parentId ?? ""} className="a-input">
                <option value="">Không (là nhóm lớn)</option>
                {groups
                  .filter((g) => g.id !== category?.id)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>
        <div>
          <label htmlFor={`desc-${key}`} className="a-label">
            Mô tả ngắn
          </label>
          <textarea id={`desc-${key}`} name="description" rows={2} maxLength={300} defaultValue={category?.description} className="a-input" />
        </div>
        <div>
          <p className="a-label">Ảnh đại diện</p>
          <p className="a-help mb-3 mt-0">Hiện trong ô tròn ở trang chủ (chỉ nhóm lớn). Để trống thì lấy ảnh sản phẩm đầu tiên.</p>
          <ImagePicker name="image" initial={category?.image ? [category.image] : []} />
        </div>
        <FormMessage state={saved} />
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton>{category ? "Lưu" : "Thêm danh mục"}</SubmitButton>
          {category && <span className="text-sm text-muted">{count} sản phẩm</span>}
        </div>
      </form>

      {category && (
        <form action={remove} className="space-y-3 border-t border-line pt-4">
          <input type="hidden" name="id" value={category.id} />
          <FormMessage state={removed} />
          <ConfirmButton message={`Xóa danh mục "${category.name}"?`}>Xóa danh mục</ConfirmButton>
        </form>
      )}
    </div>
  );
}
