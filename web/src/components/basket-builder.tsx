"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { EMPTY_BOX, newUid, setBox, useBox, type BoxDraft, type Placed } from "@/lib/box-store";
import { formatVnd, type BasketOption, type FruitOption } from "@/lib/builder";
import { ChatIcon, PhoneIcon } from "./icons";

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/* ---------- Hình món ---------- */

/** Ảnh thật của món; món chưa có ảnh thì hiện hộp quà. */
function ItemArt({ fruit, sizes }: { fruit: FruitOption; sizes: string }) {
  if (fruit.image) {
    return <Image src={fruit.image} alt="" fill sizes={sizes} draggable={false} className="pointer-events-none select-none object-contain" />;
  }
  return (
    <svg viewBox="-26 -32 52 56" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
      <rect x="-22" y="-18" width="44" height="38" rx="5" fill="#c5a253" />
      <rect x="-4" y="-18" width="8" height="38" fill="#0b3d17" />
      <rect x="-22" y="-4" width="44" height="8" fill="#0b3d17" />
      <path d="M0-18C-10-30-18-22-10-18ZM0-18C10-30 18-22 10-18Z" fill="#0b3d17" />
    </svg>
  );
}

/** Khoảng trống phía trên hộp (tính theo chiều cao ảnh hộp) để trái cao như thơm, nho nhô lên khỏi miệng hộp. */
const HEADROOM = 0.24;

/* ---------- Nút cộng trừ ---------- */

function Stepper({
  value,
  onMinus,
  onPlus,
  label,
  plusDisabled,
  minusDisabled,
}: {
  value: number;
  onMinus: () => void;
  onPlus: () => void;
  label: string;
  plusDisabled?: boolean;
  minusDisabled?: boolean;
}) {
  const btn =
    "inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-line bg-white text-lg font-semibold leading-none transition-colors duration-150 hover:border-forest-700 disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button type="button" className={btn} onClick={onMinus} disabled={minusDisabled} aria-label={`Bớt ${label}`}>
        −
      </button>
      <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={onPlus} disabled={plusDisabled} aria-label={`Thêm ${label}`}>
        +
      </button>
    </div>
  );
}

/* ---------- Trang xếp giỏ ---------- */

type Moving = { uid: string; x: number; y: number };

export function BasketBuilder({
  baskets,
  fruits,
  priceNote,
  reference,
  zalo,
  phone,
  phoneHref,
}: {
  baskets: BasketOption[];
  fruits: FruitOption[];
  priceNote: string;
  reference: string;
  zalo: string;
  phone: string;
  phoneHref: string;
}) {
  const box = useBox();
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState("");
  /** Món đang được kéo trong giỏ: vị trí tạm, chỉ ghi lại khi thả tay. */
  const [moving, setMoving] = useState<Moving | null>(null);
  /** Món đang được kéo từ danh sách vào giỏ. */
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; over: boolean } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pending = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const grab = useRef<{ dx: number; dy: number } | null>(null);

  const basketIndex = Math.max(0, baskets.findIndex((b) => b.id === box.basket));
  const basket = baskets[basketIndex];
  const byId = new Map(fruits.map((f) => [f.id, f]));

  // Bỏ qua những món khách đã đặt nhưng cửa hàng đã gỡ khỏi danh sách.
  const items = box.items.filter((i) => byId.has(i.id));
  const count = items.length;
  const full = count >= basket.capacity;
  const lines = fruits.map((f) => ({ fruit: f, n: items.filter((i) => i.id === f.id).length })).filter((l) => l.n > 0);

  const perBasket = basket.price + lines.reduce((a, l) => a + l.n * l.fruit.price, 0);
  const total = perBasket * box.qty;

  const update = (patch: Partial<BoxDraft>) => {
    setBox({ ...box, items, ...patch });
    setStatus("");
  };

  /** Vị trí con trỏ theo tỉ lệ khung giỏ. */
  const toStage = (clientX: number, clientY: number) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return { x: 0.5, y: 0.5, inside: false };
    const x = (clientX - r.left) / r.width;
    const y = (clientY - r.top) / r.height;
    return { x, y, inside: x >= 0 && x <= 1 && y >= 0 && y <= 1 };
  };

  function add(id: string, at?: { x: number; y: number }) {
    if (full) {
      setStatus(`${basket.name} đã đầy (${basket.capacity} món). Hãy bỏ bớt một món trước khi thêm.`);
      return;
    }
    // Bấm để thêm: rải quanh giữa lòng giỏ để các món không chồng khít lên nhau.
    const n = count;
    const spot = at ?? { x: 0.5 + (((n * 37) % 37) - 18) / 100, y: 0.46 + ((n * 53) % 13) / 100 };
    const uid = newUid();
    update({ items: [...items, { uid, id, x: clamp(spot.x, 0.08, 0.92), y: clamp(spot.y, 0.08, 0.86) }] });
    setSelected(uid);
  }

  const removeUid = (uid: string) => {
    update({ items: items.filter((i) => i.uid !== uid) });
    if (selected === uid) setSelected("");
  };

  function removeOne(id: string) {
    const last = [...items].reverse().find((i) => i.id === id);
    if (last) removeUid(last.uid);
  }

  /** Đổi thứ tự chồng: món ở cuối danh sách nằm trên cùng. */
  function restack(uid: string, toFront: boolean) {
    const it = items.find((i) => i.uid === uid);
    if (!it) return;
    const rest = items.filter((i) => i.uid !== uid);
    update({ items: toFront ? [...rest, it] : [it, ...rest] });
  }

  function chooseBasket(b: BasketOption) {
    if (count > b.capacity) {
      setStatus(`${b.name} chỉ chứa ${b.capacity} món, hộp của bạn đang có ${count}. Hãy bỏ bớt món trước khi đổi.`);
      return;
    }
    update({ basket: b.id });
  }

  /* Kéo món từ danh sách vào giỏ. Nút giữ con trỏ nên vẫn nhận sự kiện khi kéo ra ngoài. */
  const paletteHandlers = (id: string) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      pending.current = { x: e.clientX, y: e.clientY };
      dragged.current = false;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Không giữ được con trỏ (hiếm gặp): vẫn kéo được trong phạm vi nút.
      }
    },
    onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => {
      const start = pending.current;
      if (!start) return;
      if (!dragged.current && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 8) return;
      dragged.current = true;
      setDrag({ id, x: e.clientX, y: e.clientY, over: toStage(e.clientX, e.clientY).inside });
    },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      const wasDragging = pending.current && dragged.current;
      pending.current = null;
      setDrag(null);
      const p = toStage(e.clientX, e.clientY);
      if (wasDragging && p.inside) add(id, p);
    },
    onPointerCancel: () => {
      pending.current = null;
      setDrag(null);
    },
    // Kéo xong trình duyệt vẫn bắn "click": chỉ coi là bấm khi không kéo.
    onClick: () => {
      if (!dragged.current) add(id);
    },
  });

  /* Kéo món đã nằm trong giỏ sang vị trí khác; kéo ra ngoài khung là bỏ món đó. */
  const placedHandlers = (it: Placed) => ({
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      const p = toStage(e.clientX, e.clientY);
      grab.current = { dx: p.x - it.x, dy: p.y - it.y };
      setSelected(it.uid);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // như trên
      }
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      if (!grab.current) return;
      const p = toStage(e.clientX, e.clientY);
      setMoving({ uid: it.uid, x: p.x - grab.current.dx, y: p.y - grab.current.dy });
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      const g = grab.current;
      grab.current = null;
      setMoving(null);
      if (!g) return;
      const p = toStage(e.clientX, e.clientY);
      if (!p.inside) {
        removeUid(it.uid);
        return;
      }
      const x = clamp(p.x - g.dx, 0.04, 0.96);
      const y = clamp(p.y - g.dy, 0.04, 0.9);
      if (Math.abs(x - it.x) < 0.004 && Math.abs(y - it.y) < 0.004) return; // chỉ bấm chọn, không dời
      // Món vừa dời được đưa lên trên cùng, giống như vừa đặt vào giỏ.
      update({ items: [...items.filter((i) => i.uid !== it.uid), { ...it, x, y }] });
    },
    onPointerCancel: () => {
      grab.current = null;
      setMoving(null);
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = e.shiftKey ? 0.05 : 0.02;
      const move: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (move[e.key]) {
        e.preventDefault();
        const [dx, dy] = move[e.key];
        update({ items: items.map((i) => (i.uid === it.uid ? { ...i, x: clamp(i.x + dx, 0.04, 0.96), y: clamp(i.y + dy, 0.04, 0.9) } : i)) });
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeUid(it.uid);
      }
    },
  });

  const message = [
    "Chào HT Food, mình muốn đặt hộp quà tự xếp:",
    `- Kiểu hộp: ${basket.name}`,
    ...lines.map((l) => `- ${l.fruit.name} × ${l.n}`),
    `- Số hộp: ${box.qty}`,
    `- Tạm tính: ${formatVnd(perBasket)} / hộp, tổng ${formatVnd(total)}`,
    box.date && `- Ngày nhận: ${box.date.split("-").reverse().join("/")}`,
    reference && `- Mẫu tham khảo: ${reference}`,
    box.note && `- Ghi chú: ${box.note}`,
  ]
    .filter(Boolean)
    .join("\n");

  async function copy(openZalo: boolean) {
    try {
      await navigator.clipboard.writeText(message);
      setStatus(openZalo ? "Đã sao chép đơn. Dán vào khung chat Zalo vừa mở." : "Đã sao chép nội dung đơn.");
    } catch {
      setStatus("Trình duyệt không cho sao chép tự động.");
    }
    if (openZalo && zalo) window.open(zalo, "_blank", "noopener,noreferrer");
  }

  const dragFruit = drag && byId.get(drag.id);
  const selectedItem = items.find((i) => i.uid === selected);
  const selectedFruit = selectedItem && byId.get(selectedItem.id);
  const toolBtn = "a-btn a-btn-ghost min-h-11 px-3 text-[0.85rem]";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
      <div className="min-w-0">
        {/* Khung giỏ */}
        <div
          className={`mx-auto max-w-[620px] rounded-[30px] border-2 border-dashed bg-gradient-to-b from-sage/50 to-ivory/60 p-4 transition-colors duration-200 ${
            drag?.over ? "border-forest-600 bg-sage" : "border-line"
          }`}
        >
          <div className="flex items-center justify-between gap-3 px-2 text-[0.9rem]">
            <p className="font-semibold text-forest-800">{basket.name}</p>
            <p className={`font-semibold tabular-nums ${full ? "text-danger" : "text-muted"}`}>
              {count}/{basket.capacity} món
            </p>
          </div>

          <div
            ref={stageRef}
            className="relative mt-1 w-full touch-none select-none"
            style={{ aspectRatio: String(basket.ratio / (1 + HEADROOM)) }}
            onPointerDown={(e) => e.target === e.currentTarget && setSelected("")}
          >
            {/* Ảnh hộp nằm dưới các món */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ aspectRatio: String(basket.ratio) }}>
              <Image src={basket.image} alt="" fill priority sizes="(min-width: 640px) 590px, 92vw" className="object-contain drop-shadow-[0_18px_18px_rgb(7_47_15/0.18)]" />
            </div>
            {items
              .map((it, z) => ({ it, z }))
              .sort((a, b) => a.it.uid.localeCompare(b.it.uid))
              .map(({ it, z }) => {
              const fruit = byId.get(it.id)!;
              const pos = moving?.uid === it.uid ? moving : it;
              const active = selected === it.uid;
              return (
                <div
                  key={it.uid}
                  role="button"
                  tabIndex={0}
                  aria-label={`${fruit.name} trong hộp. Kéo để dời chỗ, phím mũi tên để nhích, Delete để bỏ.`}
                  aria-pressed={active}
                  {...placedHandlers(it)}
                  className={`basket-pop absolute cursor-grab touch-none rounded-2xl outline-offset-2 active:cursor-grabbing ${
                    active ? "outline-2 outline-dashed outline-forest-600" : ""
                  } ${moving?.uid === it.uid ? "drop-shadow-[0_14px_14px_rgb(7_47_15/0.35)]" : "drop-shadow-[0_5px_5px_rgb(7_47_15/0.22)]"}`}
                  style={{
                    left: `${pos.x * 100}%`,
                    top: `${pos.y * 100}%`,
                    width: `${fruit.size * 100}%`,
                    aspectRatio: String(fruit.ratio),
                    translate: "-50% -50%",
                    zIndex: moving?.uid === it.uid ? 100 : z + 1,
                  }}
                >
                  <ItemArt fruit={fruit} sizes="180px" />
                </div>
              );
            })}
            {/* Thành hộp phía trước vẽ đè lên các món: cùng tấm ảnh, chỉ lấy phần thành trước */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[90]" style={{ aspectRatio: String(basket.ratio), clipPath: basket.front }}>
              <Image src={basket.image} alt="" fill sizes="(min-width: 640px) 590px, 92vw" className="object-contain" />
            </div>
            {count === 0 && (
              <p className="pointer-events-none absolute inset-x-6 top-[30%] z-[95] text-center text-[0.98rem] font-medium text-forest-800/80">
                Kéo trái cây thả vào hộp, hoặc bấm vào trái cây để thêm.
              </p>
            )}
          </div>

          {/* Thao tác với món đang chọn */}
          <div className="mt-2 flex min-h-11 flex-wrap items-center justify-center gap-2">
            {selectedItem && selectedFruit ? (
              <>
                <span className="mr-1 text-[0.9rem] font-semibold">{selectedFruit.name}:</span>
                <button type="button" className={toolBtn} onClick={() => restack(selectedItem.uid, true)}>
                  Đưa lên trước
                </button>
                <button type="button" className={toolBtn} onClick={() => restack(selectedItem.uid, false)}>
                  Đưa ra sau
                </button>
                <button type="button" className="a-btn a-btn-danger min-h-11 px-3 text-[0.85rem]" onClick={() => removeUid(selectedItem.uid)}>
                  Bỏ khỏi hộp
                </button>
              </>
            ) : (
              <p className="text-center text-[0.88rem] text-muted">
                {count > 0 ? "Kéo từng món để dời chỗ. Bấm vào một món để đưa lên trước, ra sau hoặc bỏ đi." : "Hộp đang trống."}
              </p>
            )}
          </div>
        </div>

        {/* Món để chọn */}
        <h2 className="mt-9 font-display text-[1.35rem]">Chọn trái cây</h2>
        <p className="mt-1 text-[0.92rem] text-muted">Kéo vào đúng chỗ bạn muốn trong hộp, hoặc bấm để thêm rồi dời sau.</p>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {fruits.map((f) => {
            const n = items.filter((i) => i.id === f.id).length;
            return (
              <li key={f.id}>
                <button
                  type="button"
                  {...paletteHandlers(f.id)}
                  aria-label={`Thêm ${f.name} vào hộp, ${formatVnd(f.price)} một ${f.unit}`}
                  className="group flex w-full cursor-grab touch-none select-none flex-col items-center rounded-2xl border border-line bg-white/70 px-3 pb-3 pt-3 text-center transition-colors duration-200 hover:border-forest-600 hover:bg-sage/40 active:cursor-grabbing"
                >
                  <span className="relative block size-20 transition-transform duration-200 group-hover:-translate-y-1">
                    <ItemArt fruit={f} sizes="80px" />
                  </span>
                  <span className="mt-2 flex min-h-[2.6em] items-center text-[0.95rem] font-semibold leading-[1.3]">{f.name}</span>
                  <span className="text-[0.85rem] text-gold-deep">
                    {formatVnd(f.price)} / {f.unit}
                  </span>
                  <span className={`mt-1.5 rounded-full px-2.5 py-0.5 text-[0.75rem] font-semibold ${n > 0 ? "bg-forest-800 text-cream" : "invisible"}`}>
                    Đã thêm {n}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bảng tính tiền */}
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="rounded-[26px] border border-line bg-white/80 p-6">
          <h2 className="font-display text-[1.25rem]">Kiểu hộp</h2>
          <div className="mt-3 space-y-2" role="radiogroup" aria-label="Kiểu hộp">
            {baskets.map((b) => {
              const on = b.id === basket.id;
              return (
                <label
                  key={b.id}
                  className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-2 transition-colors duration-150 ${
                    on ? "border-forest-800 bg-forest-800 text-cream" : "border-line bg-white hover:border-forest-700"
                  }`}
                >
                  <input type="radio" name="basket" className="sr-only" checked={on} onChange={() => chooseBasket(b)} />
                  <span>
                    <span className="block font-semibold leading-tight">{b.name}</span>
                    <span className={`text-[0.82rem] ${on ? "text-cream/75" : "text-muted"}`}>Tối đa {b.capacity} món</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">{formatVnd(b.price)}</span>
                </label>
              );
            })}
          </div>

          <h2 className="mt-7 font-display text-[1.25rem]">Trong hộp</h2>
          {lines.length === 0 ? (
            <p className="mt-2 text-[0.95rem] text-muted">Chưa có món nào.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {lines.map((l) => (
                <li key={l.fruit.id} className="flex items-center gap-3 py-2.5">
                  <span className="relative block size-10 shrink-0">
                    <ItemArt fruit={l.fruit} sizes="40px" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold leading-tight">{l.fruit.name}</p>
                    <p className="text-[0.85rem] tabular-nums text-muted">{formatVnd(l.n * l.fruit.price)}</p>
                  </div>
                  <Stepper value={l.n} label={l.fruit.name} onMinus={() => removeOne(l.fruit.id)} onPlus={() => add(l.fruit.id)} plusDisabled={full} />
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
            <div>
              <p className="font-display text-[1.25rem] leading-tight">Số hộp</p>
              <p className="text-[0.85rem] text-muted">Đặt nhiều hộp giống nhau</p>
            </div>
            <Stepper
              value={box.qty}
              label="một hộp"
              onMinus={() => update({ qty: Math.max(1, box.qty - 1) })}
              onPlus={() => update({ qty: Math.min(999, box.qty + 1) })}
              minusDisabled={box.qty <= 1}
            />
          </div>
          <label className="mt-3 flex items-center justify-end gap-2 text-[0.85rem] text-muted">
            Nhập số hộp
            <input
              type="number"
              min={1}
              max={999}
              inputMode="numeric"
              value={box.qty}
              onChange={(e) => update({ qty: clamp(Math.floor(Number(e.target.value) || 1), 1, 999) })}
              className="a-input w-24 text-right tabular-nums"
            />
          </label>

          <dl className="mt-6 space-y-2 border-t border-line pt-5 tabular-nums">
            <div className="flex justify-between gap-3 text-[0.95rem]">
              <dt className="text-muted">Một hộp</dt>
              <dd className="font-semibold">{formatVnd(perBasket)}</dd>
            </div>
            <div className="flex justify-between gap-3 text-[0.95rem]">
              <dt className="text-muted">Số hộp</dt>
              <dd className="font-semibold">× {box.qty}</dd>
            </div>
            <div className="flex items-end justify-between gap-3 pt-2">
              <dt className="font-display text-[1.1rem]">Tổng tạm tính</dt>
              <dd className="font-display text-[1.9rem] font-extrabold leading-none text-forest-700" aria-live="polite">
                {formatVnd(total)}
              </dd>
            </div>
          </dl>
          {priceNote && <p className="mt-3 rounded-xl bg-ivory px-4 py-3 text-[0.85rem] leading-relaxed text-ink/80">{priceNote}</p>}

          <div className="mt-6 grid gap-4">
            <div>
              <label htmlFor="gio-ngay" className="a-label">
                Ngày cần nhận
              </label>
              <input id="gio-ngay" type="date" value={box.date} onChange={(e) => update({ date: e.target.value })} className="a-input min-h-12" />
            </div>
            <div>
              <label htmlFor="gio-ghi-chu" className="a-label">
                Ghi chú
              </label>
              <textarea
                id="gio-ghi-chu"
                rows={2}
                maxLength={400}
                value={box.note}
                onChange={(e) => update({ note: e.target.value })}
                placeholder="Lời chúc trên thiệp, tên công ty, địa chỉ nhận…"
                className="a-input"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {zalo && (
              <button type="button" disabled={count === 0} onClick={() => copy(true)} className="btn btn-gold disabled:cursor-not-allowed disabled:opacity-50">
                <ChatIcon />
                Gửi đơn qua Zalo
              </button>
            )}
            <button type="button" disabled={count === 0} onClick={() => copy(false)} className="btn btn-line disabled:cursor-not-allowed disabled:opacity-50">
              Sao chép nội dung đơn
            </button>
            <a href={phoneHref} className="btn btn-line">
              <PhoneIcon />
              Gọi {phone}
            </a>
          </div>

          <p role="status" className="mt-4 min-h-6 text-[0.9rem] font-medium text-forest-700">
            {status}
          </p>

          {(count > 0 || box.qty > 1) && (
            <button
              type="button"
              onClick={() => {
                setBox({ ...EMPTY_BOX, basket: box.basket });
                setSelected("");
                setStatus("");
              }}
              className="min-h-11 cursor-pointer text-[0.9rem] text-muted underline underline-offset-4 hover:text-ink"
            >
              Xếp lại từ đầu
            </button>
          )}
        </div>
        {zalo && (
          <p className="mt-4 px-1 text-[0.85rem] leading-relaxed text-muted">
            Zalo không cho điền sẵn tin nhắn, nên website chép nội dung đơn giúp bạn; bạn chỉ cần dán vào khung chat với HT Food.
          </p>
        )}
      </aside>

      {/* Món đang được kéo từ danh sách */}
      {drag && dragFruit && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 size-24 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_12px_14px_rgb(7_47_15/0.35)]"
          style={{ left: drag.x, top: drag.y }}
        >
          <ItemArt fruit={dragFruit} sizes="96px" />
        </div>
      )}
    </div>
  );
}
