"use client";

import { useSyncExternalStore } from "react";

// Lựa chọn "Tự chọn hộp quà" của khách, giữ trong trình duyệt để quay lại vẫn còn.

export type BoxDraft = {
  style: string;
  budget: string;
  items: string[];
  occasion: string;
  date: string;
  note: string;
};

export const EMPTY_BOX: BoxDraft = { style: "", budget: "", items: [], occasion: "", date: "", note: "" };

const KEY = "ht-food-box";
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
    const parsed = raw ? (JSON.parse(raw) as Partial<BoxDraft>) : {};
    cacheValue = { ...EMPTY_BOX, ...parsed, items: Array.isArray(parsed.items) ? parsed.items : [] };
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
