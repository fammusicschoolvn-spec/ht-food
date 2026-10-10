import type { Category } from "./types";

// Danh mục có hai cấp: nhóm lớn (không có parentId) và danh mục con.

export const topLevel = (cats: Category[]) => cats.filter((c) => !c.parentId);

export const childrenOf = (cats: Category[], id: string) => cats.filter((c) => c.parentId === id);

export const parentOf = (cats: Category[], c: Category) => cats.find((x) => x.id === c.parentId);

/** Chính nó và các danh mục con: sản phẩm thuộc nhóm lớn gồm cả sản phẩm của nhóm con. */
export const familyIds = (cats: Category[], c: Category) => [c.id, ...childrenOf(cats, c.id).map((x) => x.id)];

/** "Bánh › Bánh quy" cho ô chọn và danh sách quản trị. */
export function fullName(cats: Category[], c: Category): string {
  const parent = parentOf(cats, c);
  return parent ? `${parent.name} › ${c.name}` : c.name;
}
