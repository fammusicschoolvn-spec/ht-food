import { slugify } from "./format";

// Dữ liệu cho trang "Tự xếp giỏ quà".
// Quản trị nhập mỗi dòng một mục: "Tên | giá | đơn vị" (món) và "Tên | giá | sức chứa" (hộp).
// Tên hộp có chữ "lục giác" dùng ảnh hộp lục giác, còn lại dùng ảnh hộp chữ nhật.

/** Ảnh thật tách nền trong `public/trai/`: [tên file, bề rộng so với khung giỏ, tỉ lệ rộng/cao]. */
const PHOTOS = {
  apple: ["tao", 0.21, 301 / 304],
  orange: ["cam", 0.21, 318 / 274],
  pear: ["le", 0.17, 226 / 313],
  kiwi: ["kiwi", 0.15, 241 / 269],
  mango: ["xoai", 0.22, 282 / 294],
  melon: ["dua-luoi", 0.27, 277 / 326],
  melonYellow: ["dua-vang", 0.22, 236 / 309],
  grapeGreen: ["nho-xanh", 0.27, 345 / 341],
  grapeRed: ["nho-do", 0.25, 294 / 324],
  grapeBlack: ["nho-den", 0.26, 319 / 303],
  cherry: ["cherry", 0.19, 282 / 325],
  strawberry: ["dau-tay", 0.22, 351 / 307],
  blueberry: ["viet-quat", 0.2, 308 / 259],
  dragon: ["thanh-long", 0.23, 296 / 372],
  pineapple: ["thom", 0.17, 187 / 390],
} as const;

type Kind = keyof typeof PHOTOS;

export type FruitOption = {
  id: string;
  name: string;
  price: number;
  unit: string;
  /** Đường dẫn ảnh thật; rỗng nếu tên món chưa có ảnh (hiện hình hộp quà). */
  image: string;
  /** Bề rộng món so với bề rộng khung giỏ (0–1). */
  size: number;
  /** Tỉ lệ rộng/cao của ảnh. */
  ratio: number;
};

/** Ảnh hộp thật trong `public/hop/`. `front` là vùng thành hộp phía trước (clip-path), vẽ đè lên các món để món trông như nằm trong hộp. */
const BOXES = {
  rect: { image: "/hop/chu-nhat.webp", ratio: 1200 / 890, front: "polygon(0 63.7%, 100% 46.7%, 100% 100%, 0 100%)" },
  hex: { image: "/hop/luc-giac.webp", ratio: 1200 / 898, front: "polygon(0 36.5%, 23.4% 72%, 76.6% 71.6%, 100% 37.6%, 100% 100%, 0 100%)" },
} as const;

export type BasketOption = {
  id: string;
  name: string;
  price: number;
  capacity: number;
  image: string;
  /** Tỉ lệ rộng/cao của ảnh hộp. */
  ratio: number;
  front: string;
};

/** Chọn ảnh theo tên món do quản trị nhập. */
function kindOf(name: string): Kind | null {
  const slug = slugify(name);
  const has = (w: string) => slug.split("-").includes(w);
  if (slug.includes("viet-quat")) return "blueberry";
  if (slug.includes("thanh-long")) return "dragon";
  if (has("thom") || has("khom")) return "pineapple";
  if (has("cherry")) return "cherry";
  if (has("kiwi")) return "kiwi";
  if (has("xoai")) return "mango";
  if (has("dua")) return has("vang") ? "melonYellow" : "melon";
  if (has("nho")) return has("do") ? "grapeRed" : has("den") || has("tim") ? "grapeBlack" : "grapeGreen";
  if (has("dau")) return "strawberry";
  if (has("tao")) return "apple";
  if (has("cam") || has("quyt")) return "orange";
  if (has("le")) return "pear";
  return null;
}

const cells = (line: string) => line.split("|").map((c) => c.trim());
const money = (raw: string | undefined) => Math.max(0, Math.round(Number((raw ?? "").replace(/\D/g, "")) || 0));

export function parseFruits(lines: string[]): FruitOption[] {
  const seen = new Set<string>();
  return lines.flatMap((line) => {
    const [name, price, unit] = cells(line);
    const id = slugify(name ?? "");
    if (!id || seen.has(id)) return [];
    seen.add(id);
    const kind = kindOf(name);
    const [file, size, ratio] = kind ? PHOTOS[kind] : ["", 0.2, 1];
    return [{ id, name, price: money(price), unit: unit || "phần", image: file ? `/trai/${file}.webp` : "", size, ratio }];
  });
}

export function parseBaskets(lines: string[]): BasketOption[] {
  const seen = new Set<string>();
  return lines.flatMap((line) => {
    const [name, price, capacity] = cells(line);
    const id = slugify(name ?? "");
    if (!id || seen.has(id)) return [];
    seen.add(id);
    const box = id.includes("luc-giac") ? BOXES.hex : BOXES.rect;
    return [{ id, name, price: money(price), capacity: Math.min(24, Math.max(4, money(capacity) || 10)), ...box }];
  });
}

export const formatVnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`;
