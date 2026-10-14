import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { defaultContent, seed } from "./seed";
import type { Category, Content, Db, Product } from "./types";

// Kho dữ liệu, hai cách chạy với cùng một bộ hàm:
// - Có SUPABASE_URL + SUPABASE_SECRET_KEY: lưu trên Supabase (bảng + Storage). Dùng cho web thật trên Vercel.
// - Không có: lưu file JSON + thư mục ảnh trong web/data. Dùng khi chạy thử trên máy.
// Khóa bí mật chỉ dùng ở máy chủ; trình duyệt của khách không bao giờ thấy.

const SB_URL = process.env.SUPABASE_URL?.replace(/\/+$/, "") ?? "";
const SB_KEY = process.env.SUPABASE_SECRET_KEY ?? "";
export const usingSupabase = Boolean(SB_URL && SB_KEY);

export const UPLOAD_NAME = /^[a-f0-9-]{36}\.webp$/;
const BUCKET = "media";

export function withDefaults(content: Partial<Content> | undefined): Content {
  const c = content ?? {};
  return {
    ...defaultContent,
    ...c,
    shop: { ...defaultContent.shop, ...c.shop },
    hero: { ...defaultContent.hero, ...c.hero },
    about: { ...defaultContent.about, ...c.about },
    candy: { ...defaultContent.candy, ...c.candy },
    box: {
      ...defaultContent.box,
      ...c.box,
      baskets: c.box?.baskets?.length ? c.box.baskets : defaultContent.box.baskets,
      fruits: c.box?.fruits?.length ? c.box.fruits : defaultContent.box.fruits,
    },
    steps: c.steps?.length ? c.steps : defaultContent.steps,
  };
}

/* ================= Supabase ================= */

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  category_id: string;
  price_min: number;
  price_label: string;
  description: string;
  images: string[];
  featured: boolean;
  visible: boolean;
  created_at: string;
  code: string | null;
  stock: number | null;
  thumb?: string | null;
};

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  parent_id: string | null;
  image: string;
  sort: number;
};

const toProduct = (r: ProductRow): Product => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  categoryId: r.category_id,
  priceMin: Number(r.price_min) || 0,
  priceLabel: r.price_label,
  description: r.description ?? "",
  images: Array.isArray(r.images) ? r.images : [],
  featured: r.featured,
  visible: r.visible,
  createdAt: r.created_at,
  code: r.code ?? undefined,
  stock: r.stock == null ? undefined : Number(r.stock),
  thumb: r.thumb || undefined,
});

const fromProduct = (p: Product): ProductRow => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  category_id: p.categoryId,
  price_min: p.priceMin,
  price_label: p.priceLabel,
  description: p.description,
  images: p.images,
  featured: p.featured,
  visible: p.visible,
  created_at: p.createdAt,
  code: p.code ?? null,
  stock: p.stock ?? null,
  thumb: p.thumb ?? "",
});

const toCategory = (r: CategoryRow): Category => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  description: r.description ?? "",
  parentId: r.parent_id,
  image: r.image ?? "",
});

async function sb(pathname: string, init: RequestInit & { headers?: Record<string, string> } = {}): Promise<Response> {
  const res = await fetch(`${SB_URL}${pathname}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      // Supabase từ chối khóa bí mật nếu yêu cầu trông như đến từ trình duyệt.
      "User-Agent": "ht-food-server",
      ...init.headers,
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res;
}

/** Đọc hết một bảng theo từng trang 1000 dòng (giới hạn mặc định của Supabase). */
async function sbAll<T>(table: string, order: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const res = await sb(`/rest/v1/${table}?select=*&order=${order}`, { headers: { Range: `${from}-${from + 999}` } });
    const page = (await res.json()) as T[];
    out.push(...page);
    if (page.length < 1000) return out;
  }
}

const json = (body: unknown, prefer = "return=minimal") => ({
  body: JSON.stringify(body),
  headers: { "Content-Type": "application/json", Prefer: prefer },
});

/* ================= File trên máy ================= */

// turbopackIgnore: đây là dữ liệu lúc chạy, không phải file cần đóng gói cùng mã nguồn.
const DATA_DIR = process.env.HT_DATA_DIR ?? path.join(/* turbopackIgnore: true */ process.cwd(), "data");
const DB_FILE = path.join(/* turbopackIgnore: true */ DATA_DIR, "db.json");
const UPLOAD_DIR = path.join(/* turbopackIgnore: true */ DATA_DIR, "uploads");

async function readFileDb(): Promise<Db> {
  try {
    const raw = JSON.parse(await fs.readFile(DB_FILE, "utf8")) as Partial<Db>;
    return {
      categories: raw.categories ?? seed.categories,
      products: raw.products ?? seed.products,
      content: withDefaults(raw.content),
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return structuredClone(seed);
    throw err;
  }
}

let queue: Promise<unknown> = Promise.resolve();

/** Đọc, sửa rồi ghi lại file; các lần ghi xếp hàng để không đè lên nhau. */
function mutateFile<T>(fn: (db: Db) => T): Promise<T> {
  const run = queue.then(async () => {
    const db = await readFileDb();
    const result = fn(db);
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${DB_FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db), "utf8");
    await fs.rename(tmp, DB_FILE);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

/* ================= Các hàm dùng chung ================= */

export async function readDb(): Promise<Db> {
  if (!usingSupabase) return readFileDb();
  const [categories, products, content] = await Promise.all([
    sbAll<CategoryRow>("categories", "sort.asc"),
    sbAll<ProductRow>("products", "created_at.desc"),
    sb("/rest/v1/site_content?select=data&id=eq.1").then((r) => r.json() as Promise<{ data: Partial<Content> }[]>),
  ]);
  return {
    categories: categories.map(toCategory),
    products: products.map(toProduct),
    content: withDefaults(content[0]?.data),
  };
}

export async function putProduct(p: Product): Promise<void> {
  if (!usingSupabase) {
    await mutateFile((db) => {
      const i = db.products.findIndex((x) => x.id === p.id);
      if (i >= 0) db.products[i] = p;
      else db.products.push(p);
    });
    return;
  }
  await sb("/rest/v1/products?on_conflict=id", { method: "POST", ...json(fromProduct(p), "resolution=merge-duplicates,return=minimal") });
}

export async function patchProduct(id: string, fields: Partial<Pick<Product, "visible" | "featured">>): Promise<void> {
  if (!usingSupabase) {
    await mutateFile((db) => {
      const p = db.products.find((x) => x.id === id);
      if (p) Object.assign(p, fields);
    });
    return;
  }
  await sb(`/rest/v1/products?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", ...json(fields) });
}

export async function dropProduct(id: string): Promise<void> {
  if (!usingSupabase) {
    await mutateFile((db) => {
      db.products = db.products.filter((p) => p.id !== id);
    });
    return;
  }
  await sb(`/rest/v1/products?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function putCategory(c: Category): Promise<void> {
  if (!usingSupabase) {
    await mutateFile((db) => {
      const i = db.categories.findIndex((x) => x.id === c.id);
      if (i >= 0) db.categories[i] = c;
      else db.categories.push(c);
    });
    return;
  }
  // Danh mục mới xếp cuối: lấy thứ tự lớn nhất hiện có + 1.
  const last = (await (await sb("/rest/v1/categories?select=sort&order=sort.desc&limit=1")).json()) as { sort: number }[];
  const existing = (await (await sb(`/rest/v1/categories?select=sort&id=eq.${encodeURIComponent(c.id)}`)).json()) as { sort: number }[];
  const row: CategoryRow = {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    parent_id: c.parentId ?? null,
    image: c.image ?? "",
    sort: existing[0]?.sort ?? (last[0]?.sort ?? 0) + 1,
  };
  await sb("/rest/v1/categories?on_conflict=id", { method: "POST", ...json(row, "resolution=merge-duplicates,return=minimal") });
}

export async function dropCategory(id: string): Promise<void> {
  if (!usingSupabase) {
    await mutateFile((db) => {
      db.categories = db.categories.filter((c) => c.id !== id);
    });
    return;
  }
  await sb(`/rest/v1/categories?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function putContent(content: Content): Promise<void> {
  if (!usingSupabase) {
    await mutateFile((db) => {
      db.content = content;
    });
    return;
  }
  await sb("/rest/v1/site_content?on_conflict=id", { method: "POST", ...json({ id: 1, data: content }, "resolution=merge-duplicates,return=minimal") });
}

/* ---------- Ảnh tải lên ---------- */

export async function saveUpload(name: string, data: Buffer): Promise<string> {
  if (!usingSupabase) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(/* turbopackIgnore: true */ UPLOAD_DIR, name), data);
    return `/media/${name}`;
  }
  await sb(`/storage/v1/object/${BUCKET}/${name}`, {
    method: "POST",
    body: new Uint8Array(data),
    headers: { "Content-Type": "image/webp", "Cache-Control": "31536000", "x-upsert": "false" },
  });
  return `${SB_URL}/storage/v1/object/public/${BUCKET}/${name}`;
}

export async function readUpload(name: string): Promise<Buffer | null> {
  if (!UPLOAD_NAME.test(name)) return null;
  try {
    return await fs.readFile(path.join(/* turbopackIgnore: true */ UPLOAD_DIR, name));
  } catch {
    return null;
  }
}

/** Tên file của ảnh do trang quản trị tải lên (trên máy hoặc trên Supabase); ảnh khác trả về "". */
function uploadName(url: string): string {
  const local = url.startsWith("/media/") ? url.slice("/media/".length) : "";
  const remote = SB_URL && url.startsWith(`${SB_URL}/storage/v1/object/public/${BUCKET}/`) ? url.split("/").pop() ?? "" : "";
  const name = local || remote;
  return UPLOAD_NAME.test(name) ? name : "";
}

/** Xóa các ảnh tải lên không còn sản phẩm, danh mục hay nội dung nào dùng. */
export async function removeUploads(urls: string[], db: Db): Promise<void> {
  const used = new Set([
    ...db.products.flatMap((p) => p.images),
    ...db.categories.map((c) => c.image ?? ""),
    db.content.hero.image,
    db.content.hero.imageSmall,
  ]);
  for (const url of urls) {
    const name = uploadName(url);
    if (!name || used.has(url)) continue;
    if (usingSupabase) await sb(`/storage/v1/object/${BUCKET}/${name}`, { method: "DELETE" }).catch(() => undefined);
    else await fs.rm(path.join(/* turbopackIgnore: true */ UPLOAD_DIR, name), { force: true });
  }
}
