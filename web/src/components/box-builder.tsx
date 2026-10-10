"use client";

import { useState } from "react";
import { EMPTY_BOX, setBox, useBox, type BoxDraft } from "@/lib/box-store";
import { ChatIcon, CheckIcon, PhoneIcon } from "./icons";

function Choice({
  type,
  name,
  label,
  checked,
  onChange,
}: {
  type: "radio" | "checkbox";
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="relative cursor-pointer">
      <input type={type} name={name} checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="flex min-h-12 items-center gap-2 rounded-full border border-line bg-white/70 px-5 text-[0.95rem] font-medium transition-colors duration-200 hover:border-forest-700 peer-checked:border-forest-800 peer-checked:bg-forest-800 peer-checked:text-cream peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold">
        {checked && <CheckIcon width={16} height={16} />}
        {label}
      </span>
    </label>
  );
}

function StepBlock({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-5 border-t border-line py-9 sm:grid-cols-[4.5rem_1fr]">
      <span className="font-display text-[2.4rem] leading-none text-gold-deep">0{n}</span>
      <div>
        <h2 className="font-display text-[1.6rem] leading-tight">{title}</h2>
        {hint && <p className="mt-1.5 text-[0.95rem] text-muted">{hint}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </section>
  );
}

function compose(box: BoxDraft, reference: string): string {
  const rows = [
    box.style && `- Kiểu: ${box.style}`,
    box.budget && `- Ngân sách: ${box.budget}`,
    box.items.length > 0 && `- Muốn có: ${box.items.join(", ")}`,
    box.occasion && `- Dịp tặng: ${box.occasion}`,
    box.date && `- Ngày nhận: ${box.date.split("-").reverse().join("/")}`,
    reference && `- Mẫu tham khảo: ${reference}`,
    box.note && `- Ghi chú: ${box.note}`,
  ].filter(Boolean);
  return ["Chào HT Food, mình muốn đặt hộp quà tự chọn:", ...rows].join("\n");
}

export function BoxBuilder({
  styles,
  items,
  budgets,
  reference,
  zalo,
  phone,
  phoneHref,
}: {
  styles: string[];
  items: string[];
  budgets: string[];
  reference: string;
  zalo: string;
  phone: string;
  phoneHref: string;
}) {
  const box = useBox();
  const [status, setStatus] = useState("");
  const update = (patch: Partial<BoxDraft>) => {
    setBox({ ...box, ...patch });
    setStatus("");
  };
  const toggleItem = (item: string) =>
    update({ items: box.items.includes(item) ? box.items.filter((i) => i !== item) : [...box.items, item] });

  const ready = Boolean(box.style || box.budget || box.items.length);
  const message = compose(box, reference);

  async function copy(thenOpenZalo: boolean) {
    try {
      await navigator.clipboard.writeText(message);
      setStatus(thenOpenZalo ? "Đã sao chép. Dán nội dung vào khung chat Zalo vừa mở." : "Đã sao chép nội dung.");
    } catch {
      setStatus("Trình duyệt không cho sao chép tự động. Hãy bôi đen và chép nội dung bên trên.");
    }
    if (thenOpenZalo && zalo) window.open(zalo, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-16">
      <div className="border-b border-line">
        <StepBlock n={1} title="Chọn kiểu hộp, giỏ">
          <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Kiểu hộp, giỏ">
            {styles.map((s) => (
              <Choice key={s} type="radio" name="style" label={s} checked={box.style === s} onChange={() => update({ style: s })} />
            ))}
          </div>
        </StepBlock>

        <StepBlock n={2} title="Mức ngân sách">
          <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Mức ngân sách">
            {budgets.map((b) => (
              <Choice key={b} type="radio" name="budget" label={b} checked={box.budget === b} onChange={() => update({ budget: b })} />
            ))}
          </div>
        </StepBlock>

        <StepBlock n={3} title="Bạn muốn có những loại nào?" hint="Chọn bao nhiêu loại cũng được. Tùy mùa và hàng về, HT Food sẽ báo lại loại đang có.">
          <div className="flex flex-wrap gap-2.5">
            {items.map((item) => (
              <Choice key={item} type="checkbox" name="items" label={item} checked={box.items.includes(item)} onChange={() => toggleItem(item)} />
            ))}
          </div>
        </StepBlock>

        <StepBlock n={4} title="Thông tin thêm" hint="Không bắt buộc.">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="box-occasion" className="a-label">
                Dịp tặng
              </label>
              <input
                id="box-occasion"
                value={box.occasion}
                maxLength={80}
                onChange={(e) => update({ occasion: e.target.value })}
                placeholder="Sinh nhật, thăm bệnh, tân gia…"
                className="a-input min-h-12"
              />
            </div>
            <div>
              <label htmlFor="box-date" className="a-label">
                Ngày cần nhận
              </label>
              <input id="box-date" type="date" value={box.date} onChange={(e) => update({ date: e.target.value })} className="a-input min-h-12" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="box-note" className="a-label">
                Ghi chú
              </label>
              <textarea
                id="box-note"
                rows={3}
                value={box.note}
                maxLength={400}
                onChange={(e) => update({ note: e.target.value })}
                placeholder="Lời chúc trên thiệp, loại không ăn được…"
                className="a-input"
              />
            </div>
          </div>
        </StepBlock>
      </div>

      <aside className="lg:sticky lg:top-40 lg:self-start">
        <div className="rounded-[26px] bg-forest-900 p-7 text-cream">
          <p className="eyebrow text-gold">Hộp quà của bạn</p>
          {ready ? (
            <p className="mt-5 whitespace-pre-line break-words text-[0.95rem] leading-[1.75] text-cream/90">{message}</p>
          ) : (
            <p className="mt-5 leading-[1.75] text-cream/70">
              Chọn kiểu hộp, ngân sách hoặc loại trái cây ở bên cạnh, nội dung gửi cửa hàng sẽ hiện ở đây.
            </p>
          )}

          <div className="mt-7 flex flex-col gap-3">
            {zalo && (
              <button type="button" disabled={!ready} onClick={() => copy(true)} className="btn btn-gold disabled:cursor-not-allowed disabled:opacity-50">
                <ChatIcon />
                Sao chép và mở Zalo
              </button>
            )}
            <button type="button" disabled={!ready} onClick={() => copy(false)} className="btn btn-line-light disabled:cursor-not-allowed disabled:opacity-50">
              Sao chép nội dung
            </button>
            <a href={phoneHref} className="btn btn-line-light">
              <PhoneIcon />
              Gọi {phone}
            </a>
          </div>

          <p role="status" className="mt-4 min-h-6 text-[0.9rem] text-gold-soft">
            {status}
          </p>

          {ready && (
            <button
              type="button"
              onClick={() => {
                setBox(EMPTY_BOX);
                setStatus("");
              }}
              className="mt-1 min-h-11 cursor-pointer text-[0.9rem] text-cream/65 underline underline-offset-4 hover:text-cream"
            >
              Chọn lại từ đầu
            </button>
          )}
        </div>
        <p className="mt-4 px-1 text-[0.88rem] leading-relaxed text-muted">
          Zalo không cho điền sẵn tin nhắn, nên website chép nội dung giúp bạn; bạn chỉ cần dán vào khung chat với HT Food.
        </p>
      </aside>
    </div>
  );
}
