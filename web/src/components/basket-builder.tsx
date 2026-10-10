"use client";

import { useMemo, useRef, useState } from "react";
import { EMPTY_BOX, setBox, useBox, type BoxDraft } from "@/lib/box-store";
import { formatVnd, KIND_SIZE, rimHalfWidth, slotsFor, type BasketOption, type FruitOption } from "@/lib/builder";
import { FruitArt, FruitDefs, FruitIcon } from "./fruit-art";
import { ChatIcon, PhoneIcon } from "./icons";

const RIBBONS = ["#0b3d17", "#8e1218", "#c5a253", "#3b4f94"];

/* ---------- Giỏ và trái cây trong giỏ ---------- */

type Unit = { key: string; fruit: FruitOption };

function Stage({
  basket,
  ribbon,
  units,
  dropping,
  onRemove,
}: {
  basket: BasketOption;
  ribbon: string;
  units: Unit[];
  dropping: boolean;
  onRemove: (id: string) => void;
}) {
  const rw = rimHalfWidth(basket.capacity);
  const slots = useMemo(() => slotsFor(basket.capacity), [basket.capacity]);
  const L = 200 - rw;
  const R = 200 + rw;
  const bw = rw * 0.8; // nửa chiều rộng đáy giỏ

  // Trái lớn xếp trước nên nằm lớp dưới; vẽ lớp trên trước để lớp dưới che lên như nhìn từ phía trước.
  const placed = units
    .map((u, i) => ({ ...u, slot: slots[i], n: i }))
    .filter((u) => u.slot)
    .sort((a, b) => b.slot.layer - a.slot.layer || Math.abs(b.slot.x - 200) - Math.abs(a.slot.x - 200));

  return (
    <svg viewBox="0 0 400 380" className="block h-auto w-full" role="img" aria-label={`${basket.name} đang có ${units.length} món`}>
      <defs>
        <linearGradient id="bk-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2bd84" />
          <stop offset="100%" stopColor="#a8773a" />
        </linearGradient>
        <pattern id="bk-weave" width="18" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 3h9M9 9h9" stroke="#8a5f2a" strokeWidth="2.4" strokeLinecap="round" opacity="0.55" />
          <path d="M0 9h9M9 3h9" stroke="#f3dbb0" strokeWidth="2.4" strokeLinecap="round" opacity="0.6" />
        </pattern>
        <clipPath id="bk-clip">
          <path d={`M${L} 222Q${L + 4} 300 ${200 - bw} 338Q200 356 ${200 + bw} 338Q${R - 4} 300 ${R} 222Q200 250 ${L} 222Z`} />
        </clipPath>
      </defs>

      <ellipse cx="200" cy="350" rx={rw * 0.95} ry="14" fill="rgb(7 47 15 / 0.16)" />

      {/* quai giỏ nằm sau trái cây */}
      <path d={`M${L + 14} 224C${L + 14} 6 ${R - 14} 6 ${R - 14} 224`} fill="none" stroke="#a8773a" strokeWidth="11" strokeLinecap="round" />
      <path d={`M${L + 14} 224C${L + 14} 6 ${R - 14} 6 ${R - 14} 224`} fill="none" stroke="#f0d6a6" strokeWidth="3" strokeDasharray="7 9" strokeLinecap="round" />

      {/* lòng giỏ */}
      <ellipse cx="200" cy="222" rx={rw} ry="22" fill="#6b4a26" />
      <ellipse cx="200" cy="226" rx={rw - 10} ry="16" fill="#f4ecd6" opacity="0.9" />

      <g className={dropping ? "opacity-80" : ""}>
        {placed.map((u) => {
          const size = KIND_SIZE[u.fruit.kind];
          const tilt = ((u.n * 37) % 25) - 12;
          return (
            <g key={u.key} className="basket-move" style={{ transform: `translate(${u.slot.x}px, ${u.slot.y - (size - 1) * 14}px)` }}>
              <g className="basket-pop cursor-pointer" onClick={() => onRemove(u.fruit.id)}>
                <title>{`Bấm để bỏ bớt ${u.fruit.name}`}</title>
                <g transform={`rotate(${tilt}) scale(${size})`}>
                  <FruitArt kind={u.fruit.kind} />
                </g>
              </g>
            </g>
          );
        })}
      </g>

      {/* thân giỏ phía trước che phần dưới của trái cây */}
      <path
        d={`M${L} 222Q${L + 4} 300 ${200 - bw} 338Q200 356 ${200 + bw} 338Q${R - 4} 300 ${R} 222Q200 250 ${L} 222Z`}
        fill="url(#bk-body)"
      />
      <rect x={L} y="222" width={rw * 2} height="140" fill="url(#bk-weave)" clipPath="url(#bk-clip)" />
      <path d={`M${L} 222Q200 250 ${R} 222`} fill="none" stroke="#c99b58" strokeWidth="11" strokeLinecap="round" />
      <path d={`M${L} 222Q200 250 ${R} 222`} fill="none" stroke="#f3dbb0" strokeWidth="3" strokeDasharray="6 8" strokeLinecap="round" />

      {/* dải nơ */}
      <g clipPath="url(#bk-clip)">
        <path d={`M${L - 4} 268Q200 296 ${R + 4} 268V294Q200 322 ${L - 4} 294Z`} fill={ribbon} />
        <path d={`M${L - 4} 272Q200 300 ${R + 4} 272`} fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.35" />
      </g>
      <g transform="translate(200 296)">
        <g stroke="rgb(255 255 255 / 0.28)" strokeWidth="1.2">
          <path d="M-4 4L-22 44-8 38-4 52 2 10ZM4 4L22 44 8 38 4 52-2 10Z" fill={ribbon} />
          <path d="M0 0C-16-20-46-22-44 0C-46 20-16 16 0 0Z" fill={ribbon} />
          <path d="M0 0C16-20 46-22 44 0C46 20 16 16 0 0Z" fill={ribbon} />
        </g>
        <path d="M-6-4C-18-12-34-12-36-2M6-4C18-12 34-12 36-2" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.35" />
        <rect x="-8" y="-8" width="16" height="16" rx="5" fill={ribbon} stroke="rgb(255 255 255 / 0.3)" />
      </g>
    </svg>
  );
}

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
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; over: boolean } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pending = useRef<{ id: string; x: number; y: number } | null>(null);
  const dragged = useRef(false);

  const basketIndex = Math.max(0, baskets.findIndex((b) => b.id === box.basket));
  const basket = baskets[basketIndex];

  // Bỏ qua những mục khách đã chọn nhưng cửa hàng đã gỡ khỏi danh sách.
  const lines = fruits.map((f) => ({ fruit: f, n: box.counts[f.id] ?? 0 })).filter((l) => l.n > 0);
  const count = lines.reduce((a, l) => a + l.n, 0);
  const full = count >= basket.capacity;

  const units: Unit[] = lines
    .flatMap((l) => Array.from({ length: l.n }, (_, i) => ({ key: `${l.fruit.id}#${i}`, fruit: l.fruit })))
    .sort((a, b) => KIND_SIZE[b.fruit.kind] - KIND_SIZE[a.fruit.kind] || a.fruit.id.localeCompare(b.fruit.id));

  const perBasket = basket.price + lines.reduce((a, l) => a + l.n * l.fruit.price, 0);
  const total = perBasket * box.qty;

  const update = (patch: Partial<BoxDraft>) => {
    setBox({ ...box, ...patch });
    setStatus("");
  };

  function add(id: string) {
    if (full) {
      setStatus(`${basket.name} đã đầy (${basket.capacity} món). Chọn giỏ lớn hơn hoặc bớt một món.`);
      return;
    }
    update({ counts: { ...box.counts, [id]: (box.counts[id] ?? 0) + 1 } });
  }

  function remove(id: string) {
    const next = { ...box.counts };
    if ((next[id] ?? 0) <= 1) delete next[id];
    else next[id] -= 1;
    update({ counts: next });
  }

  function chooseBasket(b: BasketOption) {
    if (count > b.capacity) {
      setStatus(`${b.name} chỉ chứa ${b.capacity} món, giỏ của bạn đang có ${count}. Hãy bớt món trước khi đổi.`);
      return;
    }
    update({ basket: b.id });
  }

  /* Kéo thả bằng chuột hoặc ngón tay: nút giữ con trỏ (pointer capture) nên vẫn nhận sự kiện khi kéo ra ngoài. */
  const overStage = (x: number, y: number) => {
    const r = stageRef.current?.getBoundingClientRect();
    return Boolean(r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
  };
  const dragHandlers = (id: string) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      pending.current = { id, x: e.clientX, y: e.clientY };
      dragged.current = false;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Con trỏ không giữ được (hiếm gặp): vẫn kéo được trong phạm vi nút.
      }
    },
    onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => {
      const start = pending.current;
      if (!start) return;
      if (!dragged.current && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 8) return;
      dragged.current = true;
      setDrag({ id, x: e.clientX, y: e.clientY, over: overStage(e.clientX, e.clientY) });
    },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      const wasDragging = pending.current && dragged.current;
      pending.current = null;
      setDrag(null);
      if (wasDragging && overStage(e.clientX, e.clientY)) add(id);
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

  const message = [
    "Chào HT Food, mình muốn đặt giỏ quà tự xếp:",
    `- Kiểu giỏ: ${basket.name}`,
    ...lines.map((l) => `- ${l.fruit.name} × ${l.n}`),
    `- Số giỏ: ${box.qty}`,
    `- Tạm tính: ${formatVnd(perBasket)} / giỏ, tổng ${formatVnd(total)}`,
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

  const dragFruit = drag && fruits.find((f) => f.id === drag.id);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
      <FruitDefs />

      <div className="min-w-0">
        {/* Giỏ */}
        <div
          ref={stageRef}
          className={`relative mx-auto max-w-[560px] rounded-[30px] border-2 border-dashed bg-gradient-to-b from-sage/50 to-ivory/60 px-4 pb-2 pt-4 transition-colors duration-200 ${
            drag?.over ? "border-forest-600 bg-sage" : "border-line"
          }`}
        >
          <div className="flex items-center justify-between gap-3 px-2 text-[0.9rem]">
            <p className="font-semibold text-forest-800">{basket.name}</p>
            <p className={`font-semibold tabular-nums ${full ? "text-danger" : "text-muted"}`}>
              {count}/{basket.capacity} món
            </p>
          </div>
          <Stage basket={basket} ribbon={RIBBONS[basketIndex % RIBBONS.length]} units={units} dropping={Boolean(drag)} onRemove={remove} />
          {count === 0 && (
            <p className="pointer-events-none absolute inset-x-6 top-[30%] text-center text-[0.98rem] font-medium text-forest-800/80">
              Kéo trái cây thả vào giỏ, hoặc bấm vào trái cây để thêm.
            </p>
          )}
        </div>

        {/* Trái cây để chọn */}
        <h2 className="mt-9 font-display text-[1.35rem]">Chọn trái cây</h2>
        <p className="mt-1 text-[0.92rem] text-muted">Kéo vào giỏ hoặc bấm để thêm. Bấm vào trái trong giỏ để bỏ bớt.</p>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {fruits.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                {...dragHandlers(f.id)}
                aria-label={`Thêm ${f.name} vào giỏ, ${formatVnd(f.price)} một ${f.unit}`}
                className="group flex w-full cursor-grab touch-none select-none flex-col items-center rounded-2xl border border-line bg-white/70 px-3 pb-3 pt-2 text-center transition-colors duration-200 hover:border-forest-600 hover:bg-sage/40 active:cursor-grabbing"
              >
                <span className="transition-transform duration-200 group-hover:-translate-y-1">
                  <FruitIcon kind={f.kind} size={64} />
                </span>
                <span className="mt-1 flex min-h-[2.6em] items-center text-[0.95rem] font-semibold leading-[1.3]">{f.name}</span>
                <span className="text-[0.85rem] text-gold-deep">
                  {formatVnd(f.price)} / {f.unit}
                </span>
                {(box.counts[f.id] ?? 0) > 0 && (
                  <span className="mt-1.5 rounded-full bg-forest-800 px-2.5 py-0.5 text-[0.75rem] font-semibold text-cream">
                    Đã thêm {box.counts[f.id]}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Bảng tính tiền */}
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="rounded-[26px] border border-line bg-white/80 p-6">
          <h2 className="font-display text-[1.25rem]">Kiểu giỏ</h2>
          <div className="mt-3 space-y-2" role="radiogroup" aria-label="Kiểu giỏ">
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

          <h2 className="mt-7 font-display text-[1.25rem]">Trong giỏ</h2>
          {lines.length === 0 ? (
            <p className="mt-2 text-[0.95rem] text-muted">Chưa có món nào.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {lines.map((l) => (
                <li key={l.fruit.id} className="flex items-center gap-3 py-2.5">
                  <FruitIcon kind={l.fruit.kind} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold leading-tight">{l.fruit.name}</p>
                    <p className="text-[0.85rem] tabular-nums text-muted">{formatVnd(l.n * l.fruit.price)}</p>
                  </div>
                  <Stepper value={l.n} label={l.fruit.name} onMinus={() => remove(l.fruit.id)} onPlus={() => add(l.fruit.id)} plusDisabled={full} />
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
            <div>
              <p className="font-display text-[1.25rem] leading-tight">Số giỏ</p>
              <p className="text-[0.85rem] text-muted">Đặt nhiều giỏ giống nhau</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Stepper
                value={box.qty}
                label="một giỏ"
                onMinus={() => update({ qty: Math.max(1, box.qty - 1) })}
                onPlus={() => update({ qty: Math.min(999, box.qty + 1) })}
                minusDisabled={box.qty <= 1}
              />
            </div>
          </div>
          <label className="mt-3 flex items-center justify-end gap-2 text-[0.85rem] text-muted">
            Nhập số giỏ
            <input
              type="number"
              min={1}
              max={999}
              inputMode="numeric"
              value={box.qty}
              onChange={(e) => update({ qty: Math.min(999, Math.max(1, Math.floor(Number(e.target.value) || 1))) })}
              className="a-input w-24 text-right tabular-nums"
            />
          </label>

          <dl className="mt-6 space-y-2 border-t border-line pt-5 tabular-nums">
            <div className="flex justify-between gap-3 text-[0.95rem]">
              <dt className="text-muted">Một giỏ</dt>
              <dd className="font-semibold">{formatVnd(perBasket)}</dd>
            </div>
            <div className="flex justify-between gap-3 text-[0.95rem]">
              <dt className="text-muted">Số giỏ</dt>
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

      {/* Trái cây đang được kéo */}
      {drag && dragFruit && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_12px_14px_rgb(7_47_15/0.35)]"
          style={{ left: drag.x, top: drag.y }}
        >
          <FruitIcon kind={dragFruit.kind} size={84} />
        </div>
      )}
    </div>
  );
}
