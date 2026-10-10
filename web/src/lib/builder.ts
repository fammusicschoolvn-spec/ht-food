import { slugify } from "./format";

// Dữ liệu và cách xếp trái cho trang "Tự xếp giỏ quà".
// Quản trị nhập mỗi dòng một mục: "Tên | giá | đơn vị" (trái cây) và "Tên | giá | sức chứa" (giỏ).

export type FruitKind =
  | "apple"
  | "orange"
  | "pear"
  | "kiwi"
  | "mango"
  | "melon"
  | "melonYellow"
  | "grapeGreen"
  | "grapePurple"
  | "cherry"
  | "strawberry"
  | "blueberry"
  | "gift";

export type FruitOption = { id: string; name: string; price: number; unit: string; kind: FruitKind };
export type BasketOption = { id: string; name: string; price: number; capacity: number };

/** Độ lớn tương đối khi vẽ trong giỏ; trái lớn được xếp trước, nằm lớp dưới. */
export const KIND_SIZE: Record<FruitKind, number> = {
  melon: 1.5,
  melonYellow: 1.4,
  grapeGreen: 1.25,
  grapePurple: 1.25,
  mango: 1.15,
  pear: 1.05,
  apple: 1,
  orange: 1,
  gift: 0.95,
  kiwi: 0.85,
  cherry: 0.85,
  strawberry: 0.8,
  blueberry: 0.8,
};

function kindOf(name: string): FruitKind {
  const slug = slugify(name);
  const words = slug.split("-");
  const has = (w: string) => words.includes(w);
  if (slug.includes("viet-quat")) return "blueberry";
  if (has("cherry")) return "cherry";
  if (has("kiwi")) return "kiwi";
  if (has("xoai")) return "mango";
  if (has("dua")) return has("vang") ? "melonYellow" : "melon";
  if (has("nho")) return has("xanh") ? "grapeGreen" : "grapePurple";
  if (has("dau")) return "strawberry";
  if (has("tao")) return "apple";
  if (has("cam") || has("quyt")) return "orange";
  if (has("le")) return "pear";
  return "gift";
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
    return [{ id, name, price: money(price), unit: unit || "phần", kind: kindOf(name) }];
  });
}

export function parseBaskets(lines: string[]): BasketOption[] {
  const seen = new Set<string>();
  return lines.flatMap((line) => {
    const [name, price, capacity] = cells(line);
    const id = slugify(name ?? "");
    if (!id || seen.has(id)) return [];
    seen.add(id);
    return [{ id, name, price: money(price), capacity: Math.min(24, Math.max(4, money(capacity) || 10)) }];
  });
}

export const formatVnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

/* ---------- Xếp trái vào giỏ ---------- */

export type Slot = { x: number; y: number; layer: number };

/** Số chỗ mỗi hàng ở lớp dưới cùng, theo sức chứa của giỏ. */
export const perRow = (capacity: number) => Math.max(3, Math.round(Math.sqrt(capacity * 1.4)));

/** Nửa chiều rộng miệng giỏ (đơn vị của khung vẽ 400×380). */
export const rimHalfWidth = (capacity: number) => Math.min(178, perRow(capacity) * 36 + 22);

/**
 * Các chỗ đặt trái, xếp như chồng trái cây nhìn từ phía trước:
 * lớp dưới rộng nhất, càng lên càng hẹp; trong mỗi lớp điền từ giữa ra hai bên.
 */
export function slotsFor(capacity: number): Slot[] {
  const first = perRow(capacity);
  const spacing = ((rimHalfWidth(capacity) - 26) * 2) / first;
  const slots: Slot[] = [];
  let left = capacity;
  for (let layer = 0; left > 0; layer++) {
    const size = Math.min(left, Math.max(1, first - Math.floor(layer / 2)));
    const offsets = Array.from({ length: size }, (_, i) => i - (size - 1) / 2).sort((a, b) => Math.abs(a) - Math.abs(b));
    for (const o of offsets) slots.push({ x: 200 + o * spacing, y: 212 - layer * 33, layer });
    left -= size;
  }
  return slots;
}
