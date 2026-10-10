import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { defaultContent, seed } from "./seed";
import type { Content, Db } from "./types";

// Kho dữ liệu chạy trên máy: một file JSON + thư mục ảnh tải lên.
// Khi đưa lên Vercel (ổ đĩa chỉ đọc) cần thay bằng kho Supabase có cùng ba hàm
// readDb / mutateDb / saveUpload.

// turbopackIgnore: đây là dữ liệu lúc chạy, không phải file cần đóng gói cùng mã nguồn.
const DATA_DIR = process.env.HT_DATA_DIR ?? path.join(/* turbopackIgnore: true */ process.cwd(), "data");
const DB_FILE = path.join(/* turbopackIgnore: true */ DATA_DIR, "db.json");
export const UPLOAD_DIR = path.join(/* turbopackIgnore: true */ DATA_DIR, "uploads");

function withDefaults(content: Partial<Content> | undefined): Content {
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

export async function readDb(): Promise<Db> {
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

/** Đọc, sửa rồi ghi lại; các lần ghi xếp hàng để không đè lên nhau. */
export function mutateDb<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await readDb();
    const result = await fn(db);
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${DB_FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await fs.rename(tmp, DB_FILE);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export async function saveUpload(name: string, data: Buffer): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(/* turbopackIgnore: true */ UPLOAD_DIR, name), data);
  return `/media/${name}`;
}

export const UPLOAD_NAME = /^[a-f0-9-]{36}\.webp$/;

export async function readUpload(name: string): Promise<Buffer | null> {
  if (!UPLOAD_NAME.test(name)) return null;
  try {
    return await fs.readFile(path.join(/* turbopackIgnore: true */ UPLOAD_DIR, name));
  } catch {
    return null;
  }
}

/** Xóa các ảnh tải lên không còn sản phẩm hay nội dung nào dùng. */
export async function removeUploads(urls: string[], db: Db): Promise<void> {
  const used = new Set([
    ...db.products.flatMap((p) => p.images),
    ...db.categories.map((c) => c.image ?? ""),
    db.content.hero.image,
    db.content.hero.imageSmall,
  ]);
  for (const url of urls) {
    const name = url.startsWith("/media/") ? url.slice("/media/".length) : "";
    if (!UPLOAD_NAME.test(name) || used.has(url)) continue;
    await fs.rm(path.join(/* turbopackIgnore: true */ UPLOAD_DIR, name), { force: true });
  }
}
