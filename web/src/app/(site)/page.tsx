import Image from "next/image";
import Link from "next/link";
import { ContactButtons } from "@/components/contact-buttons";
import { ArrowIcon, BoxIcon, ClockIcon, LeafIcon, PhoneIcon, PinIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product-card";
import { SectionTitle } from "@/components/section-title";
import { familyIds, topLevel } from "@/lib/categories";
import { getCatalog, inTier, PRICE_TIERS } from "@/lib/data";
import { mapEmbed, mapLink } from "@/lib/format";

export default async function HomePage() {
  const { products, categories, content } = await getCatalog();
  const { shop, hero, about, steps } = content;
  const groups = topLevel(categories);
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name;

  const featured = products.filter((p) => p.featured).slice(0, 8);
  const showcase = featured.length >= 4 ? featured : products.slice(0, 8);

  // Tách tiêu đề ở dấu phẩy đầu tiên: vế sau in nghiêng màu vàng.
  const comma = hero.title.indexOf(",");
  const titleLead = comma > 0 ? hero.title.slice(0, comma + 1) : hero.title;
  const titleTail = comma > 0 ? hero.title.slice(comma + 1).trim() : "";

  return (
    <>
      {/* Mở đầu: ảnh trái cây bày quanh viền, chữ nằm ở khoảng trống giữa ảnh */}
      <section className="relative isolate overflow-hidden bg-[#ede2cf]">
        <Image
          src={hero.image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
        {/* Điện thoại: khung hẹp nên trái cây lấn vào chữ, phủ một lớp màu nền cho dễ đọc. */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-[#ede2cf]/70 lg:hidden" />
        <div className="container-x flex min-h-[560px] flex-col items-center justify-center py-20 text-center lg:min-h-[660px]">
          <p className="rise text-[0.9rem] font-semibold uppercase tracking-[0.16em] text-forest-900">{hero.eyebrow}</p>
          <h1 className="display rise rise-2 mt-5 max-w-[42rem] text-[clamp(2.1rem,4.6vw,3.7rem)] uppercase leading-[1.14] text-forest-950">
            {titleLead}
            {titleTail && (
              <>
                {" "}
                <span className="mt-2 inline-block rounded-2xl bg-forest-800 px-4 py-1 text-cream">{titleTail}</span>
              </>
            )}
          </h1>
          <p className="rise rise-3 mt-6 max-w-[34rem] text-[1.06rem] font-medium leading-[1.75] text-forest-950/85">{hero.subtitle}</p>
          <div className="rise rise-3 mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/san-pham" className="btn btn-forest px-8 uppercase tracking-[0.06em]">
              Xem mẫu quà
              <ArrowIcon width={18} height={18} />
            </Link>
            <Link href="/tu-chon-hop-qua" className="btn btn-gold px-7 uppercase tracking-[0.06em]">
              <BoxIcon />
              Tự chọn hộp quà
            </Link>
          </div>
        </div>
      </section>

      {/* Dải thông tin xanh */}
      <section className="bg-forest-600 text-cream">
        <ul className="container-x grid gap-x-8 gap-y-5 py-7 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <PinIcon width={22} height={22} />, top: "Cửa hàng", text: shop.address },
            { icon: <PhoneIcon width={22} height={22} />, top: "Điện thoại / Zalo", text: shop.phone },
            { icon: <LeafIcon width={22} height={22} />, top: "Danh mục", text: `${groups.length} nhóm sản phẩm` },
            { icon: <BoxIcon width={22} height={22} />, top: "Theo ý bạn", text: "Tự chọn hộp quà" },
          ].map((item) => (
            <li key={item.top} className="grid grid-cols-[3rem_1fr] items-center gap-4">
              <span className="inline-flex size-12 items-center justify-center rounded-full border border-cream/50">{item.icon}</span>
              <span>
                <span className="eyebrow block text-gold-soft">{item.top}</span>
                <span className="mt-1 block text-[0.95rem] font-medium leading-snug">{item.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Danh mục */}
      <section className="container-x py-20 lg:py-24">
        <SectionTitle eyebrow="Danh mục" title="Danh mục sản phẩm" />
        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {groups.map((g) => {
            const ids = familyIds(categories, g);
            const items = products.filter((p) => ids.includes(p.categoryId));
            const cover = g.image || items[0]?.images[0];
            return (
              <li key={g.id}>
                <Link href={`/san-pham?dm=${g.slug}`} className="group flex flex-col items-center text-center">
                  <span className="relative block size-32 overflow-hidden rounded-full bg-sage ring-1 ring-line transition-shadow duration-300 group-hover:ring-4 group-hover:ring-forest-600/30">
                    {cover ? (
                      <Image src={cover} alt="" fill sizes="128px" className={`object-cover ${g.image ? "" : "object-bottom"}`} />
                    ) : (
                      <span className="flex size-full items-center justify-center text-forest-600">
                        <LeafIcon width={38} height={38} />
                      </span>
                    )}
                  </span>
                  {/* Chừa đủ hai dòng tên để dòng số lượng của cả hàng thẳng nhau. */}
                  <h3 className="mt-5 flex min-h-[2.7em] items-center font-display text-[0.9rem] font-bold uppercase leading-[1.35] tracking-[0.04em] text-balance transition-colors duration-200 group-hover:text-forest-600">
                    {g.name}
                  </h3>
                  <p className="mt-1 text-[0.85rem] text-muted">{items.length > 0 ? `${items.length} sản phẩm` : "Đang cập nhật"}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Mẫu nổi bật */}
      <section className="bg-ivory/60 py-20 lg:py-28">
        <div className="container-x">
          <SectionTitle eyebrow="Mẫu nổi bật" title="Những mẫu quà HT Food gợi ý" />
          <nav aria-label="Xem theo danh mục" className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-1">
            <Link href="/san-pham" className="inline-flex min-h-11 items-center text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-forest-600">
              Tất cả
            </Link>
            {groups
              .filter((g) => products.some((x) => familyIds(categories, g).includes(x.categoryId)))
              .map((c) => (
              <Link
                key={c.id}
                href={`/san-pham?dm=${c.slug}`}
                className="inline-flex min-h-11 items-center text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-ink transition-colors duration-200 hover:text-forest-600"
              >
                {c.name}
              </Link>
            ))}
          </nav>
          <div className="mt-12">
            <ProductGrid products={showcase} categoryName={categoryName} />
          </div>
          <div className="mt-12 flex justify-center">
            <Link href="/san-pham" className="btn btn-line">
              Xem tất cả {products.length} mẫu
              <ArrowIcon width={18} height={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Tự chọn hộp quà */}
      <section className="container-x pt-20 lg:pt-28">
        <div className="grid overflow-hidden rounded-[30px] bg-forest-900 text-cream lg:grid-cols-[1.25fr_0.75fr]">
          <div className="p-8 sm:p-12 lg:p-16">
            <p className="eyebrow flex items-center gap-3 text-gold">
              <BoxIcon width={18} height={18} />
              Tự chọn hộp quà
            </p>
            <h2 className="display mt-4 text-[clamp(2rem,4vw,3.1rem)] leading-[1.1] text-balance">{content.box.title}</h2>
            <p className="mt-5 max-w-[32rem] leading-[1.75] text-cream/80">{content.box.intro}</p>
            <Link href="/tu-chon-hop-qua" className="btn btn-gold mt-8">
              Bắt đầu chọn
              <ArrowIcon width={18} height={18} />
            </Link>
            <ul className="mt-10 flex flex-wrap gap-2.5" aria-label="Một số loại có thể chọn">
            {content.box.items.slice(0, 12).map((item) => (
              <li key={item} className="inline-flex min-h-11 items-center rounded-full border border-cream/20 px-5 text-[0.95rem] text-cream/90">
                {item}
              </li>
            ))}
            </ul>
          </div>
          <div className="relative min-h-[260px]">
            <Image src="/hero/kiwi.webp" alt="" fill sizes="(min-width: 1024px) 440px, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* Chọn theo ngân sách */}
      <section className="container-x py-20 lg:py-28">
        <SectionTitle eyebrow="Chọn theo ngân sách" title="Mức giá nào cũng có mẫu đẹp" />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRICE_TIERS.map((tier) => {
            const count = products.filter((p) => inTier(p, tier.id)).length;
            return (
              <li key={tier.id}>
                <Link
                  href={`/san-pham?gia=${tier.id}`}
                  className="group flex h-full flex-col justify-between rounded-[22px] border border-line bg-white/70 p-7 transition-colors duration-300 hover:border-forest-800 hover:bg-forest-900 hover:text-cream"
                >
                  <p className="min-h-[2.5em] font-display text-[1.3rem] font-bold leading-[1.25] text-balance">{tier.label}</p>
                  <p className="mt-10 flex items-center justify-between text-[0.92rem] font-semibold text-muted transition-colors duration-300 group-hover:text-gold-soft">
                    {count} mẫu
                    <ArrowIcon width={18} height={18} />
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Giới thiệu + cách đặt */}
      <section className="bg-forest-900 py-20 text-cream lg:py-28">
        <div className="container-x grid gap-16 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="eyebrow text-gold">Về HT Food</p>
            <h2 className="display mt-4 text-[clamp(2rem,4vw,3.1rem)] leading-[1.1] text-balance">{about.title}</h2>
            <p className="mt-7 max-w-[32rem] text-[1.05rem] leading-[1.8] text-cream/80">{about.body}</p>
          </div>
          <ol className="divide-y divide-cream/15 border-y border-cream/15">
            {steps.map((step, i) => (
              <li key={i} className="grid grid-cols-[3.5rem_1fr] gap-4 py-7 sm:grid-cols-[5rem_1fr]">
                <span className="font-display text-[2.4rem] leading-none text-gold">0{i + 1}</span>
                <div>
                  <h3 className="font-display text-[1.45rem]">{step.title}</h3>
                  <p className="mt-2 leading-[1.75] text-cream/75">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Cửa hàng */}
      <section className="container-x grid gap-12 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-28">
        <div>
          <p className="eyebrow text-gold-deep">Ghé cửa hàng</p>
          <h2 className="display mt-4 text-[clamp(2rem,4vw,3.1rem)] leading-[1.1]">{shop.name} ở Gia Ray, Xuân Lộc.</h2>
          <ul className="mt-8 space-y-4 text-[1.02rem]">
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
          <div className="mt-9">
            <ContactButtons shop={shop} />
          </div>
        </div>
        <div className="overflow-hidden rounded-[26px] border border-line bg-ivory">
          <iframe
            title={`Bản đồ đến ${shop.name}`}
            src={mapEmbed(shop.address)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block aspect-[4/3] w-full"
          />
        </div>
      </section>
    </>
  );
}
