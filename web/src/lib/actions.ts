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
import { mutateDb, removeUploads } from "./store";
import type { Db } from "./types";

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

const IMAGE_URL = /^\/(products|media|hero|categories)\/[a-z0-9-]+\.webp$/;

function parseImages(fd: FormData): string[] {
  try {
    const list: unknown = JSON.parse(String(fd.get("images") ?? "[]"));
    if (!Array.isArray(list)) return [];
    return list.filter((u): u is string => typeof u === "string" && IMAGE_URL.test(u)).slice(0, 8);
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
  const name = text(fd, "name", 120);
  const categoryId = text(fd, "categoryId", 80);
  const priceLabel = text(fd, "priceLabel", 60);
  const priceMin = Math.max(0, Math.round(Number(text(fd, "priceMin", 12).replace(/\D/g, "")) || 0));
  const images = parseImages(fd);

  if (!name) return { error: "Vui lòng nhập tên sản phẩm." };
  if (!priceLabel) return { error: "Vui lòng nhập giá hiển thị." };
  if (images.length === 0) return { error: "Vui lòng thêm ít nhất một ảnh." };

  const error = await mutateDb(async (db) => {
    if (!db.categories.some((c) => c.id === categoryId)) return "Vui lòng chọn danh mục.";
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
      const dropped = existing.images.filter((u) => !images.includes(u));
      Object.assign(existing, fields);
      await removeUploads(dropped, db);
    } else {
      db.products.push({
        id: randomUUID(),
        slug: uniqueSlug(slugify(name), db.products.map((p) => p.slug)),
        createdAt: new Date().toISOString(),
        ...fields,
      });
    }
    return null;
  });
  if (error) return { error };

  updateTag(CATALOG_TAG);
  redirect("/admin/san-pham");
}

export async function deleteProduct(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = text(fd, "id", 80);
  await mutateDb(async (db) => {
    const gone = db.products.find((p) => p.id === id);
    db.products = db.products.filter((p) => p.id !== id);
    if (gone) await removeUploads(gone.images, db);
  });
  updateTag(CATALOG_TAG);
  redirect("/admin/san-pham");
}

export async function toggleProduct(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = text(fd, "id", 80);
  const field = text(fd, "field", 20);
  if (field !== "visible" && field !== "featured") return;
  await mutateDb((db) => {
    const p = db.products.find((x) => x.id === id);
    if (p) p[field] = !p[field];
  });
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
  const image = IMAGE_URL.test(rawImage) ? rawImage : "";
  if (!name) return { error: "Vui lòng nhập tên danh mục." };

  const error = await mutateDb(async (db) => {
    const existing = db.categories.find((c) => c.id === id);
    const parent = parentId ? db.categories.find((c) => c.id === parentId) : null;
    // Chỉ có hai cấp: nhóm cha phải là nhóm lớn, và nhóm đang có con thì không thể thành con.
    if (parentId && (!parent || parent.parentId || parent.id === id)) return "Nhóm đã chọn không hợp lệ.";
    if (parentId && existing && db.categories.some((c) => c.parentId === existing.id)) {
      return "Danh mục này đang có danh mục con nên phải là nhóm lớn.";
    }
    if (existing) {
      const oldImage = existing.image ?? "";
      Object.assign(existing, { name, description, parentId, image });
      if (oldImage !== image) await removeUploads([oldImage], db);
    } else {
      db.categories.push({
        id: randomUUID(),
        slug: uniqueSlug(slugify(name), db.categories.map((c) => c.slug)),
        name,
        description,
        parentId,
        image,
      });
    }
    return null;
  });
  if (error) return { error };
  updateTag(CATALOG_TAG);
  return { ok: id ? "Đã lưu danh mục." : "Đã thêm danh mục." };
}

export async function deleteCategory(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(fd, "id", 80);
  const error = await mutateDb(async (db: Db) => {
    const kids = db.categories.filter((c) => c.parentId === id).length;
    if (kids > 0) return `Nhóm còn ${kids} danh mục con. Hãy xóa hoặc chuyển danh mục con trước.`;
    const count = db.products.filter((p) => p.categoryId === id).length;
    if (count > 0) return `Danh mục còn ${count} sản phẩm. Hãy chuyển hoặc xóa sản phẩm trước.`;
    const gone = db.categories.find((c) => c.id === id);
    db.categories = db.categories.filter((c) => c.id !== id);
    if (gone?.image) await removeUploads([gone.image], db);
    return null;
  });
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
    return IMAGE_URL.test(v) ? v : fallback;
  };

  await mutateDb(async (db) => {
    const old = db.content;
    db.content = {
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
    await removeUploads([old.hero.image, old.hero.imageSmall], db);
  });
  updateTag(CATALOG_TAG);
  return { ok: "Đã lưu. Trang khách xem đã cập nhật." };
}
