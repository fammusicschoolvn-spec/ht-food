import type { Metadata } from "next";
import { ContactButtons } from "@/components/contact-buttons";
import { ClockIcon, PhoneIcon, PinIcon } from "@/components/icons";
import { getCatalog } from "@/lib/data";
import { mapEmbed, mapLink } from "@/lib/format";

export const metadata: Metadata = {
  title: "Liên hệ",
  description: "Địa chỉ, điện thoại, Zalo của HT Food – 136 Hùng Vương, TT. Gia Ray, Xuân Lộc, Đồng Nai.",
};

export default async function ContactPage() {
  const { content } = await getCatalog();
  const { shop, steps } = content;

  return (
    <>
      <header className="bg-forest-900 text-cream">
        <div className="container-x py-16 lg:py-24">
          <p className="eyebrow text-gold">Liên hệ</p>
          <h1 className="display mt-4 max-w-3xl text-[clamp(2.3rem,5vw,4rem)] leading-[1.05] text-balance">
            Nhắn cho {shop.name} mẫu quà bạn cần.
          </h1>
          <div className="mt-9">
            <ContactButtons shop={shop} tone="dark" />
          </div>
        </div>
      </header>

      <section className="container-x grid gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:py-24">
        <div>
          <h2 className="display text-[2rem] leading-tight">Thông tin cửa hàng</h2>
          <ul className="mt-7 space-y-5 text-[1.04rem]">
            <li className="flex gap-3">
              <PinIcon className="mt-1 shrink-0 text-forest-600" />
              <a href={mapLink(shop.address)} target="_blank" rel="noopener noreferrer" className="underline decoration-line underline-offset-4 hover:decoration-forest-600">
                {shop.address}
              </a>
            </li>
            <li className="flex gap-3">
              <PhoneIcon className="mt-1 shrink-0 text-forest-600" />
              <span>Điện thoại / Zalo: {shop.phone}</span>
            </li>
            {shop.hours && (
              <li className="flex gap-3">
                <ClockIcon className="mt-1 shrink-0 text-forest-600" />
                <span>{shop.hours}</span>
              </li>
            )}
          </ul>

          <h2 className="display mt-14 text-[2rem] leading-tight">Cách đặt quà</h2>
          <ol className="mt-6 divide-y divide-line border-y border-line">
            {steps.map((step, i) => (
              <li key={i} className="grid grid-cols-[3.5rem_1fr] gap-3 py-6">
                <span className="font-display text-[2rem] leading-none text-gold-deep">0{i + 1}</span>
                <div>
                  <h3 className="font-display text-[1.3rem]">{step.title}</h3>
                  <p className="mt-1.5 leading-[1.7] text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="overflow-hidden rounded-[26px] border border-line bg-ivory lg:sticky lg:top-28 lg:self-start">
          <iframe
            title={`Bản đồ đến ${shop.name}`}
            src={mapEmbed(shop.address)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block aspect-[4/3] w-full lg:aspect-square"
          />
        </div>
      </section>
    </>
  );
}
