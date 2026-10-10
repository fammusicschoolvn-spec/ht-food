"use client";

import { useSyncExternalStore } from "react";

// Giỏ quà khách đang tự xếp, giữ trong trình duyệt để quay lại vẫn còn.

/** Một món đã đặt vào giỏ. `x`, `y` là vị trí tâm món, tính theo tỉ lệ khung giỏ (0–1). */
export type Placed = { uid: string; id: string; x: number; y: number };

export type BoxDraft = {
  /** Mã kiểu giỏ đang chọn; rỗng = kiểu đầu tiên. */
  basket: string;
  /** Các món trong MỘT giỏ; món đứng sau nằm đè lên món đứng trước. */
  items: Placed[];
  /** Số giỏ giống nhau cần đặt. */
  qty: number;
  date: string;
  note: string;
};

export const EMPTY_BOX: BoxDraft = { basket: "", items: [], qty: 1, date: "", note: "" };

const KEY = "ht-food-gio-2";
const EVENT = "ht-food-box-change";

let cacheRaw: string | null = null;
let cacheValue: BoxDraft = EMPTY_BOX;

const unit = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.5);

function read(): BoxDraft {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return cacheValue;
  }
  if (raw === cacheRaw) return cacheValue;
  cacheRaw = raw;
  try {
    const p = raw ? (JSON.parse(raw) as Partial<BoxDraft>) : {};
    const items = (Array.isArray(p.items) ? p.items : [])
      .filter((i): i is Placed => Boolean(i) && typeof i.uid === "string" && typeof i.id === "string")
      .slice(0, 24)
      .map((i) => ({ uid: i.uid, id: i.id, x: unit(i.x), y: unit(i.y) }));
    cacheValue = {
      basket: typeof p.basket === "string" ? p.basket : "",
      items,
      qty: Math.min(999, Math.max(1, Math.floor(Number(p.qty) || 1))),
      date: typeof p.date === "string" ? p.date : "",
      note: typeof p.note === "string" ? p.note : "",
    };
  } catch {
    cacheValue = EMPTY_BOX;
  }
  return cacheValue;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function setBox(next: BoxDraft): void {
  cacheValue = next;
  cacheRaw = JSON.stringify(next);
  try {
    window.localStorage.setItem(KEY, cacheRaw);
  } catch {
    // Trình duyệt chặn lưu trữ: vẫn dùng được trong phiên này.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useBox(): BoxDraft {
  return useSyncExternalStore(subscribe, read, () => EMPTY_BOX);
}

/** Tổng số món trong một giỏ. */
export const boxCount = (box: BoxDraft) => box.items.length;

/** Mã riêng cho từng món đặt vào giỏ (hai trái táo là hai món khác nhau). */
export const newUid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
