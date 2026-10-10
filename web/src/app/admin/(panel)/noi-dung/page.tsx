import type { Metadata } from "next";
import { ContentForm } from "@/components/admin/content-form";
import { requireAdmin } from "@/lib/auth";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Nội dung & liên hệ" };

export default async function AdminContent() {
  await requireAdmin();
  const { content } = await readDb();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[2.2rem] leading-tight">Nội dung & liên hệ</h1>
        <p className="mt-1 text-sm text-muted">Sửa chữ, ảnh mở đầu và đường dẫn liên hệ. Bấm Lưu là website đổi ngay.</p>
      </div>
      <ContentForm content={content} />
    </div>
  );
}
