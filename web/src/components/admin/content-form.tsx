"use client";

import { useActionState } from "react";
import { saveContent, type FormState } from "@/lib/actions";
import type { Content } from "@/lib/types";
import { FormMessage, SubmitButton } from "./form-bits";
import { ImagePicker } from "./image-picker";

function Field({
  name,
  label,
  value,
  help,
  rows,
  type = "text",
  placeholder,
  required,
}: {
  name: string;
  label: string;
  value: string;
  help?: string;
  rows?: number;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="a-label">
        {label}
      </label>
      {rows ? (
        <textarea id={name} name={name} rows={rows} defaultValue={value} className="a-input" />
      ) : (
        <input id={name} name={name} type={type} defaultValue={value} placeholder={placeholder} required={required} className="a-input" />
      )}
      {help && <p className="a-help">{help}</p>}
    </div>
  );
}

export function ContentForm({ content }: { content: Content }) {
  const [state, action] = useActionState<FormState, FormData>(saveContent, {});
  const { shop, hero, about, steps, candy, box } = content;

  return (
    <form action={action} className="space-y-6">
      <fieldset className="a-card space-y-5">
        <legend className="float-left mb-5 w-full font-display text-[1.5rem]">Thông tin cửa hàng & liên hệ</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="shopName" label="Tên cửa hàng" value={shop.name} required />
          <Field name="phone" label="Điện thoại / Zalo" value={shop.phone} type="tel" required />
        </div>
        <Field name="tagline" label="Dòng giới thiệu ngắn" value={shop.tagline} />
        <Field name="address" label="Địa chỉ" value={shop.address} help="Bản đồ trên website tự tìm theo địa chỉ này." required />
        <Field name="hours" label="Giờ mở cửa" value={shop.hours} placeholder="Ví dụ: 7:00 – 21:00 mỗi ngày" help="Để trống thì không hiện." />
        <Field name="zalo" label="Đường dẫn Zalo" value={shop.zalo} type="url" placeholder="https://zalo.me/…" />
        <Field name="facebook" label="Đường dẫn trang Facebook" value={shop.facebook} type="url" placeholder="https://www.facebook.com/…" help="Để trống thì nút Facebook tự ẩn." />
        <Field name="messenger" label="Đường dẫn Messenger" value={shop.messenger} type="url" placeholder="https://m.me/…" help="Để trống thì nút Messenger tự ẩn." />
      </fieldset>

      <fieldset className="a-card space-y-5">
        <legend className="float-left mb-5 w-full font-display text-[1.5rem]">Trang chủ: phần mở đầu</legend>
        <Field name="announcement" label="Dải thông báo trên cùng" value={content.announcement} help="Ví dụ: nhận đặt giỏ quà Tết. Để trống thì không hiện." />
        <Field name="heroEyebrow" label="Dòng nhỏ phía trên tiêu đề" value={hero.eyebrow} />
        <Field name="heroTitle" label="Tiêu đề lớn" value={hero.title} help="Phần sau dấu phẩy đầu tiên sẽ in nghiêng màu vàng." required />
        <Field name="heroSubtitle" label="Đoạn mô tả" value={hero.subtitle} rows={3} />
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="a-label">Ảnh nền phần mở đầu</p>
            <ImagePicker name="heroImage" initial={[hero.image]} />
          </div>
          <input type="hidden" name="heroImageSmall" value={hero.imageSmall} />
        </div>
      </fieldset>

      <fieldset className="a-card space-y-5">
        <legend className="float-left mb-5 w-full font-display text-[1.5rem]">Giới thiệu & cách đặt quà</legend>
        <Field name="aboutTitle" label="Tiêu đề giới thiệu" value={about.title} />
        <Field name="aboutBody" label="Nội dung giới thiệu" value={about.body} rows={4} />
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid gap-4 border-t border-line pt-5 sm:grid-cols-[14rem_1fr]">
            <Field name={`stepTitle${i}`} label={`Bước ${i + 1}`} value={steps[i]?.title ?? ""} />
            <Field name={`stepBody${i}`} label="Mô tả" value={steps[i]?.body ?? ""} rows={2} />
          </div>
        ))}
      </fieldset>

      <fieldset className="a-card space-y-5">
        <legend className="float-left mb-5 w-full font-display text-[1.5rem]">Trang “Tự chọn hộp quà”</legend>
        <Field name="boxTitle" label="Tiêu đề" value={box.title} />
        <Field name="boxIntro" label="Lời dẫn" value={box.intro} rows={2} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="boxStyles" label="Các kiểu hộp, giỏ" value={box.styles.join("\n")} rows={8} help="Mỗi dòng một kiểu." />
          <Field name="boxItems" label="Các loại khách được chọn" value={box.items.join("\n")} rows={8} help="Mỗi dòng một loại trái cây, bánh kẹo đang có." />
        </div>
      </fieldset>

      <fieldset className="a-card space-y-5">
        <legend className="float-left mb-5 w-full font-display text-[1.5rem]">Ghi chú khác</legend>
        <Field name="productNote" label="Ghi chú dưới mỗi sản phẩm" value={content.productNote} rows={3} help="Hiện ở mọi trang sản phẩm. Để trống thì không hiện." />
        <Field name="candyTitle" label="Tiêu đề khi danh mục chưa có sản phẩm" value={candy.title} />
        <Field name="candyBody" label="Lời nhắn khi danh mục chưa có sản phẩm" value={candy.body} rows={3} />
      </fieldset>

      <div className="sticky bottom-0 -mx-5 space-y-3 border-t border-line bg-[#f6f4ec]/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <FormMessage state={state} />
        <SubmitButton>Lưu nội dung</SubmitButton>
      </div>
    </form>
  );
}
