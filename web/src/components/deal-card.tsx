"use client";

import { useSyncExternalStore } from "react";
import { ArrowIcon, CloseIcon } from "./icons";

// Thẻ mời vào nhóm Zalo săn deal. Khách bấm tắt thì ẩn đến hết lần ghé này.

const KEY = "ht-food-deal-dong";
const EVENT = "ht-food-deal-change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

function isClosed(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function closeCard() {
  try {
    window.sessionStorage.setItem(KEY, "1");
  } catch {
    // Trình duyệt chặn lưu trữ: thẻ sẽ hiện lại khi chuyển trang.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function DealCard({ href }: { href: string }) {
  // Trên máy chủ coi như đã tắt để trang dựng sẵn không chớp thẻ rồi mới ẩn.
  const closed = useSyncExternalStore(subscribe, isClosed, () => true);
  if (closed) return null;

  return (
    <aside
      aria-label="Nhóm Zalo săn deal"
      className="rise fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-4 right-20 z-30 rounded-3xl bg-forest-900 p-4 pr-11 text-cream shadow-[0_24px_48px_-20px_rgb(7_47_15/0.7)] ring-1 ring-gold/40 sm:left-6 sm:right-auto sm:w-[340px] sm:p-6 sm:pr-12"
    >
      <button
        type="button"
        onClick={closeCard}
        aria-label="Tắt thông báo nhóm Zalo"
        className="absolute right-0.5 top-0.5 inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-cream/70 transition-colors duration-200 hover:bg-forest-700 hover:text-cream sm:right-1.5 sm:top-1.5"
      >
        <CloseIcon width={18} height={18} />
      </button>
      {/* Điện thoại: thẻ thu gọn còn tiêu đề và nút, để không che nội dung trang. */}
      <p className="eyebrow hidden text-gold sm:block">Nhóm Zalo cộng đồng</p>
      <p className="font-display text-[1.05rem] font-bold leading-tight sm:mt-2 sm:text-[1.5rem]">Săn deal hời mỗi ngày</p>
      <p className="mt-2 hidden text-[0.92rem] leading-relaxed text-cream/80 sm:block">Vào nhóm Zalo của HT Food để xem deal mới mỗi ngày.</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={closeCard}
        className="btn btn-gold mt-3 min-h-11 px-5 text-[0.9rem] sm:mt-4 sm:min-h-12 sm:px-6 sm:text-[0.95rem]"
      >
        Tham gia nhóm Zalo
        <ArrowIcon width={18} height={18} />
      </a>
    </aside>
  );
}
