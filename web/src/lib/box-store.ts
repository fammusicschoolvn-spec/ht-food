"use client";

import { useSyncExternalStore } from "react";

// Giỏ quà khách đang tự xếp, giữ trong trình duyệt để quay lại vẫn còn.

export type BoxDraft = {
  /** Mã kiểu giỏ đang chọn; rỗng = kiểu đầu tiên. */
  basket: string;
  /** Mã trái cây → số lượng trong MỘT giỏ. */
  counts: Record<string, number>;
  /** Số giỏ giống nhau cần đặt. */
  qty: number;
  date: string;
  note: string;
};

export const EMPTY_BOX: BoxDraft = { basket: "", counts: {}, qty: 1, date: "", note: "" };

const KEY = "ht-food-gio";
const EVENT = "ht-food-box-change";

let cacheRaw: string | null = null;
let cacheValue: BoxDraft = EMPTY_BOX;

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
    const counts: Record<string, number> = {};
    for (const [id, n] of Object.entries(p.counts ?? {})) {
      if (typeof n === "number" && n > 0) counts[id] = Math.min(24, Math.floor(n));
    }
    cacheValue = {
      ...EMPTY_BOX,
      basket: typeof p.basket === "string" ? p.basket : "",
      counts,
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
export const boxCount = (box: BoxDraft) => Object.values(box.counts).reduce((a, b) => a + b, 0);
