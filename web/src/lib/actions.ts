"use server";

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  authConfigured,
  checkPassword,
  clearFails,
  endSession,
  loginLocked,
  recordFail,
  requireAdmin,
  startSession,
} from "./auth";
import { CATALOG_TAG } from "./data";
import { safeUrl, slugify } from "./format";
import { dropCategory, dropProduct, patchProduct, putCategory, putContent, putProduct, readDb, removeUploads } from "./store";

export type FormState = { error?: string; ok?: string };

const text = (fd: FormData, key: string, max = 4000) =>
  String(fd.get(key) ?? "").trim().slice(0, max);

function uniqueSlug(base: string, taken: string[]): string {
  const root = base || "muc";
  let slug = root;
  for (let i = 2; taken.includes(slug); i++) slug = `${root}-${i}`;
  return slug;
}

const lines = (fd: FormData, key: string) =>
  [...new Set(text(fd, key, 2000).split(/\r?\n/).map((l) => l.trim().slice(0, 80)).filter(Boolean))].slice(0, 30);

const LOCAL_IMAGE = /^\/(products|media|hero|categories|trai|hop)\/[a-z0-9-]+\.webp$/;
const KIOTVIET_IMAGE = /^https:\/\/cdn2-retail-images\.kiotviet\.vn\/[\w./-]+\.(jpe?g|png|webp)$/i;
const SB_PUBLIC = `${(process.env.SUPABASE_URL ?? "").replace(/\/+$/, "")}/storage/v1/object/public/media/`;

/** Chỉ nhận ảnh của web, ảnh tải lên Supabase của web, hoặc ảnh sản phẩm trên KiotViet của cửa hàng. */
const isImageUrl = (u: string) =>
  LOCAL_IMAGE.test(u) || KIOTVIET_IMAGE.test(u) || (SB_PUBLIC.startsWith("https://") && u.startsWith(SB_PUBLIC) && /^[a-f0-9-]{36}\.webp$/.test(u.slice(SB_PUBLIC.length)));

function parseImages(fd: FormData): string[] {
  try {
    const list: unknown = JSON.parse(String(fd.get("images") ?? "[]"));
    if (!Array.isArray(list)) return [];
    return list.filter((u): u is string => typeof u === "string" && isImageUrl(u)).slice(0, 8);
  } catch {
    return [];
  }
}

/* ---------- Đăng nhập ---------- */

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  if (!authConfigured()) {
    return { error: "Chưa đặt mật khẩu quản trị. Xem hướng dẫn trong README." };
  }
  if (loginLocked()) {
    return { error: "Nhập sai quá nhiều lần. Vui lòng thử lại sau 10 phút." };
  }
  if (!checkPassword(String(fd.get("password") ?? ""))) {
    recordFail();
    return { error: "Mật khẩu không đúng." };
  }
  clearFails();
  await startSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/admin/dang-nhap");
}

/* ---------- Sản phẩm ---------- */

export async function saveProduct(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(fd, "id", 80);
  const name = text(fd, "name", 200);
  const categoryId = text(fd, "categoryId", 80);
  const priceLabel = text(fd, "priceLabel", 60);
  const priceMin = Math.max(0, Math.round(Number(text(fd, "priceMin", 12).replace(/\D/g, "")) || 0));
  const images = parseImages(fd);

  if (!name) return { error: "Vui lòng nhập tên sản phẩm." };
  if (!priceLabel) return { error: "Vui lòng nhập giá hiển thị." };

  const db = await readDb();
  if (!db.categories.some((c) => c.id === categoryId)) return { error: "Vui lòng chọn danh mục." };
  const fields = {
    name,
    categoryId,
    priceLabel,
    priceMin,
    description: text(fd, "description"),
    images,
    featured: fd.get("featured") === "on",
    visible: fd.get("visible") === "on",
  };
  const existing = db.products.find((p) => p.id === id);
  if (existing) {
    await putProduct({ ...existing, ...fields });
    const after = { ...db, products: db.products.map((p) => (p.id === id ? { ...p, ...fields } : p)) };
    await removeUploads(existing.images.filter((u) => !images.includes(u)), after);
  } else {
    await putProduct({
      id: randomUUID(),
      slug: uniqueSlug(slugify(name), db.products.map((p) => p.slug)),
      createdAt: new Date().toISOString(),
      ...fields,
    });
  }

  updateTag(CATALOG_TAG);
  redirect("/admin/san-pham");
}

export async function deleteProduct(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = text(fd, "id", 80);
  const db = await readDb();
  const gone = db.products.find((p) => p.id === id);
  if (gone) {
    await dropProduct(id);
    await removeUploads(gone.images, { ...db, products: db.products.filter((p) => p.id !== id) });
  }
  updateTag(CATALOG_TAG);
  redirect("/admin/san-pham");
}

export async function toggleProduct(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = text(fd, "id", 80);
  const field = text(fd, "field", 20);
  if (field !== "visible" && field !== "featured") return;
  const p = (await readDb()).products.find((x) => x.id === id);
  if (p) await patchProduct(id, { [field]: !p[field] });
  updateTag(CATALOG_TAG);
}

/* ---------- Danh mục ---------- */

export async function saveCategory(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(fd, "id", 80);
  const name = text(fd, "name", 80);
  const description = text(fd, "description", 300);
  const parentId = text(fd, "parentId", 80) || null;
  const rawImage = text(fd, "image", 200);
  const image = isImageUrl(rawImage) ? rawImage : "";
  if (!name) return { error: "Vui lòng nhập tên danh mục." };

  const db = await readDb();
  const existing = db.categories.find((c) => c.id === id);
  const parent = parentId ? db.categories.find((c) => c.id === parentId) : null;
  // Chỉ có hai cấp: nhóm cha phải là nhóm lớn, và nhóm đang có con thì không thể thành con.
  let error: string | null = null;
  if (parentId && (!parent || parent.parentId || parent.id === id)) error = "Nhóm đã chọn không hợp lệ.";
  else if (parentId && existing && db.categories.some((c) => c.parentId === existing.id)) {
    error = "Danh mục này đang có danh mục con nên phải là nhóm lớn.";
  } else if (existing) {
    await putCategory({ ...existing, name, description, parentId, image });
    const oldImage = existing.image ?? "";
    if (oldImage && oldImage !== image) {
      await removeUploads([oldImage], { ...db, categories: db.categories.map((c) => (c.id === id ? { ...c, image } : c)) });
    }
  } else {
    await putCategory({
      id: randomUUID(),
      slug: uniqueSlug(slugify(name), db.categories.map((c) => c.slug)),
      name,
      description,
      parentId,
      image,
    });
  }
  if (error) return { error };
  updateTag(CATALOG_TAG);
  return { ok: id ? "Đã lưu danh mục." : "Đã thêm danh mục." };
}

export async function deleteCategory(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(fd, "id", 80);
  const db = await readDb();
  const kids = db.categories.filter((c) => c.parentId === id).length;
  const count = db.products.filter((p) => p.categoryId === id).length;
  let error: string | null = null;
  if (kids > 0) error = `Nhóm còn ${kids} danh mục con. Hãy xóa hoặc chuyển danh mục con trước.`;
  else if (count > 0) error = `Danh mục còn ${count} sản phẩm. Hãy chuyển hoặc xóa sản phẩm trước.`;
  else {
    const gone = db.categories.find((c) => c.id === id);
    await dropCategory(id);
    if (gone?.image) await removeUploads([gone.image], { ...db, categories: db.categories.filter((c) => c.id !== id) });
  }
  if (error) return { error };
  updateTag(CATALOG_TAG);
  return { ok: "Đã xóa danh mục." };
}

/* ---------- Nội dung ---------- */

export async function saveContent(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const link = (key: string) => {
    const raw = text(fd, key, 300);
    return { raw, url: safeUrl(raw) };
  };
  const links = { zalo: link("zalo"), zaloGroup: link("zaloGroup"), facebook: link("facebook"), messenger: link("messenger") };
  for (const l of Object.values(links)) {
    if (l.raw && !l.url) return { error: `Đường dẫn "${l.raw}" phải bắt đầu bằng https://` };
  }
  const phone = text(fd, "phone", 30);
  const address = text(fd, "address", 200);
  if (!phone || !address) return { error: "Số điện thoại và địa chỉ không được để trống." };

  const img = (key: string, fallback: string) => {
    const v = text(fd, key, 200);
    return isImageUrl(v) ? v : fallback;
  };

  const db = await readDb();
  const old = db.content;
  const content = {
    shop: {
      name: text(fd, "shopName", 60) || old.shop.name,
      tagline: text(fd, "tagline", 120),
      address,
      phone,
      zalo: links.zalo.url,
      zaloGroup: links.zaloGroup.url,
      facebook: links.facebook.url,
      messenger: links.messenger.url,
      hours: text(fd, "hours", 120),
    },
    announcement: text(fd, "announcement", 200),
    hero: {
      eyebrow: text(fd, "heroEyebrow", 120),
      title: text(fd, "heroTitle", 120) || old.hero.title,
      subtitle: text(fd, "heroSubtitle", 400),
      image: img("heroImage", old.hero.image),
      imageSmall: img("heroImageSmall", old.hero.imageSmall),
    },
    about: { title: text(fd, "aboutTitle", 160), body: text(fd, "aboutBody", 1200) },
    steps: [0, 1, 2].map((i) => ({
      title: text(fd, `stepTitle${i}`, 60),
      body: text(fd, `stepBody${i}`, 300),
    })),
    candy: { title: text(fd, "candyTitle", 80), body: text(fd, "candyBody", 400) },
    productNote: text(fd, "productNote", 400),
    box: {
      title: text(fd, "boxTitle", 120) || old.box.title,
      intro: text(fd, "boxIntro", 400),
      priceNote: text(fd, "boxPriceNote", 300),
      baskets: lines(fd, "boxBaskets").length ? lines(fd, "boxBaskets") : old.box.baskets,
      fruits: lines(fd, "boxFruits").length ? lines(fd, "boxFruits") : old.box.fruits,
    },
  };
  await putContent(content);
  await removeUploads([old.hero.image, old.hero.imageSmall], { ...db, content });
  updateTag(CATALOG_TAG);
  return { ok: "Đã lưu. Trang khách xem đã cập nhật." };
}
