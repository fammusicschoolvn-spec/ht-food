"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useBox } from "@/lib/box-store";
import { BoxIcon, ChatIcon, ClockIcon, CloseIcon, MenuIcon, PhoneIcon, PinIcon, SearchIcon } from "./icons";

type NavItem = { href: string; label: string };
export type NavGroup = NavItem & { children: NavItem[] };

const BOX_PATH = "/tu-chon-hop-qua";

const navLink =
  "flex h-full cursor-pointer items-center gap-1.5 whitespace-nowrap text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-ink transition-colors duration-200 hover:text-forest-600";

const toolButton =
  "relative inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-forest-800 transition-colors duration-200 hover:bg-forest-800 hover:text-cream";

type Panel = "" | "menu" | "search" | "mega";

export function SiteHeader({
  groups,
  left,
  right,
  phone,
  phoneHref,
  zalo,
  address,
  hours,
}: {
  groups: NavGroup[];
  left: NavItem[];
  right: NavItem[];
  phone: string;
  phoneHref: string;
  zalo: string;
  address: string;
  hours: string;
}) {
  const [panel, setPanel] = useState<Panel>("");
  const toggle = (p: Panel) => setPanel((cur) => (cur === p ? "" : p));
  const close = () => setPanel("");
  const boxCount = useBox().items.length;

  // Rê chuột ra khỏi đầu trang thì thu bảng danh mục lại; chờ một nhịp ngắn để lỡ tay trượt ra rồi quay vào không bị đóng.
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelLeave = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = null;
  };
  const onLeave = () => {
    cancelLeave();
    leaveTimer.current = setTimeout(() => setPanel((cur) => (cur === "mega" ? "" : cur)), 180);
  };
  useEffect(() => cancelLeave, []);

  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel("");
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel]);

  return (
    <header className="sticky top-0 z-40 bg-cream xl:-top-10" onMouseEnter={cancelLeave} onMouseLeave={onLeave}>
      {/* Dải thông tin: cuộn xuống thì trượt khỏi màn hình, phần còn lại dính trên cùng. */}
      <div className="hidden h-10 bg-forest-800 text-[0.8rem] text-cream/85 xl:block">
        <div className="container-x flex h-full items-center justify-between gap-6">
          <p className="flex items-center gap-2">
            <PinIcon width={15} height={15} className="text-gold" />
            {address}
          </p>
          <div className="flex items-center gap-7">
            {hours && (
              <p className="flex items-center gap-2">
                <ClockIcon width={15} height={15} className="text-gold" />
                {hours}
              </p>
            )}
            {zalo && (
              <a href={zalo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-colors duration-200 hover:text-gold-soft">
                <ChatIcon width={15} height={15} className="text-gold" />
                Nhắn Zalo
              </a>
            )}
            <a href={phoneHref} className="flex items-center gap-2 transition-colors duration-200 hover:text-gold-soft">
              <PhoneIcon width={15} height={15} className="text-gold" />
              {phone}
            </a>
          </div>
        </div>
      </div>

      <div className="border-b border-line">
        <div className="container-x grid h-[68px] grid-cols-[1fr_auto_1fr] items-center gap-4 xl:h-[84px] xl:gap-8">
          {/* Trái: menu (máy tính) hoặc nút mở menu (điện thoại) */}
          <div className="flex h-full items-center">
            <button
              type="button"
              className={`${toolButton} -ml-2 xl:hidden`}
              aria-expanded={panel === "menu"}
              aria-controls="mobile-nav"
              aria-label={panel === "menu" ? "Đóng menu" : "Mở menu"}
              onClick={() => toggle("menu")}
            >
              {panel === "menu" ? <CloseIcon /> : <MenuIcon />}
            </button>
            <nav aria-label="Điều hướng chính" className="hidden h-full items-center gap-7 xl:flex">
              <button
                type="button"
                className={`${navLink} ${panel === "mega" ? "text-forest-600" : ""}`}
                aria-expanded={panel === "mega"}
                aria-controls="bang-danh-muc"
                onClick={() => toggle("mega")}
              >
                <MenuIcon width={18} height={18} />
                Danh mục
              </button>
              {left.map((item) => (
                <Link key={item.href} href={item.href} className={navLink} onClick={close}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Giữa: logo */}
          <Link href="/" className="flex items-center gap-2.5 whitespace-nowrap xl:px-4" onClick={close} aria-label="HT Food, về trang chủ">
            <Image src="/brand/mark-green.png" alt="" width={400} height={280} className="h-9 w-auto xl:h-11" priority />
            <span className="font-display text-[1.45rem] font-extrabold uppercase leading-none tracking-[-0.01em] text-forest-600 xl:text-[1.7rem]">
              HT Food
            </span>
          </Link>

          {/* Phải: menu còn lại và các nút công cụ */}
          <div className="flex h-full items-center justify-end gap-6">
            <nav aria-label="Điều hướng phụ" className="hidden h-full items-center gap-7 xl:flex">
              {right.map((item) => (
                <Link key={item.href} href={item.href} className={navLink} onClick={close}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center xl:gap-1">
              <button
                type="button"
                className={toolButton}
                aria-expanded={panel === "search"}
                aria-controls="khung-tim-kiem"
                aria-label={panel === "search" ? "Đóng tìm kiếm" : "Tìm sản phẩm"}
                onClick={() => toggle("search")}
              >
                {panel === "search" ? <CloseIcon /> : <SearchIcon />}
              </button>
              <Link
                href={BOX_PATH}
                className={toolButton}
                onClick={close}
                aria-label={boxCount ? `Tự chọn hộp quà: đã chọn ${boxCount} loại` : "Tự chọn hộp quà"}
                title="Tự chọn hộp quà"
              >
                <BoxIcon />
                {boxCount > 0 && (
                  <span className="absolute right-0 top-0 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[0.7rem] font-bold leading-none text-forest-950 ring-2 ring-cream">
                    {boxCount}
                  </span>
                )}
              </Link>
              <a href={phoneHref} className={`${toolButton} hidden sm:inline-flex`} aria-label={`Gọi cửa hàng ${phone}`} title={`Gọi ${phone}`}>
                <PhoneIcon />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bảng danh mục (máy tính) */}
      {panel === "mega" && (
        <div
          id="bang-danh-muc"
          className="absolute inset-x-0 top-full hidden max-h-[calc(100vh-140px)] overflow-y-auto border-b border-line bg-cream shadow-[0_24px_40px_-24px_rgb(7_47_15/0.35)] xl:block"
        >
          <div className="container-x grid grid-cols-4 gap-x-10 gap-y-9 py-10">
            {groups.map((g) => (
              <div key={g.href}>
                <Link
                  href={g.href}
                  onClick={close}
                  className="inline-flex min-h-9 items-center font-display text-[0.9rem] font-bold uppercase tracking-[0.06em] text-forest-700 transition-colors duration-200 hover:text-forest-500"
                >
                  {g.label}
                </Link>
                <ul className="mt-1 border-t border-line pt-2">
                  {g.children.map((c) => (
                    <li key={c.href}>
                      <Link href={c.href} onClick={close} className="inline-flex min-h-9 items-center text-[0.95rem] text-ink/85 transition-colors duration-200 hover:text-forest-600">
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {panel === "search" && (
        <div id="khung-tim-kiem" className="border-b border-line bg-cream">
          <form action="/san-pham" role="search" className="container-x flex items-center gap-3 py-4" onSubmit={close}>
            <label htmlFor="tim-kiem" className="sr-only">
              Tìm sản phẩm
            </label>
            <input
              id="tim-kiem"
              name="q"
              type="search"
              autoFocus
              placeholder="Tìm giỏ quà, bánh kẹo, đồ uống…"
              className="h-12 min-w-0 flex-1 rounded-full border border-line bg-white px-5 text-[0.98rem] placeholder:text-muted/70 focus:border-forest-600"
            />
            <button type="submit" className="btn btn-forest shrink-0">
              <SearchIcon />
              <span className="hidden sm:inline">Tìm</span>
            </button>
          </form>
        </div>
      )}

      {/* Menu điện thoại: mỗi nhóm bấm để xổ danh mục con */}
      {panel === "menu" && (
        <nav id="mobile-nav" aria-label="Điều hướng trên điện thoại" className="max-h-[calc(100vh-68px)] overflow-y-auto border-b border-line bg-cream xl:hidden">
          <div className="container-x flex flex-col py-2">
            <Link href="/san-pham" onClick={close} className="flex min-h-12 items-center border-b border-line text-[0.9rem] font-semibold uppercase tracking-[0.06em]">
              Tất cả sản phẩm
            </Link>
            {groups.map((g) => (
              <details key={g.href} className="group border-b border-line">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-[0.9rem] font-semibold uppercase tracking-[0.06em] [&::-webkit-details-marker]:hidden">
                  {g.label}
                  <span aria-hidden className="text-xl leading-none text-forest-600 transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <ul className="pb-3 pl-4">
                  <li>
                    <Link href={g.href} onClick={close} className="flex min-h-11 items-center font-medium text-forest-700">
                      Tất cả {g.label}
                    </Link>
                  </li>
                  {g.children.map((c) => (
                    <li key={c.href}>
                      <Link href={c.href} onClick={close} className="flex min-h-11 items-center text-ink/85">
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
            {right.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className="flex min-h-12 items-center border-b border-line text-[0.9rem] font-semibold uppercase tracking-[0.06em] last:border-0"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
