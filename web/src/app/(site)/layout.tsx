import Image from "next/image";
import Link from "next/link";
import { PhoneIcon } from "@/components/icons";
import { DealCard } from "@/components/deal-card";
import { SiteHeader } from "@/components/site-header";
import { childrenOf, topLevel } from "@/lib/categories";
import { getCatalog } from "@/lib/data";
import { mapLink, safeUrl, telHref } from "@/lib/format";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const { categories, content } = await getCatalog();
  const { shop } = content;
  const zalo = safeUrl(shop.zalo);
  const zaloGroup = safeUrl(shop.zaloGroup);
  const facebook = safeUrl(shop.facebook);
  const messenger = safeUrl(shop.messenger);

  const link = (c: { slug: string; name: string }) => ({ href: `/san-pham?dm=${c.slug}`, label: c.name });
  const groups = topLevel(categories).map((g) => ({ ...link(g), children: childrenOf(categories, g.id).map(link) }));
  const left = [{ href: "/san-pham", label: "Tất cả sản phẩm" }, ...groups.slice(0, 1)];
  const right = [
    { href: "/tu-chon-hop-qua", label: "Tự xếp giỏ quà" },
    { href: "/lien-he", label: "Liên hệ" },
  ];

  return (
    <>
      <a
        href="#noi-dung"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-gold focus:px-5 focus:py-3 focus:font-semibold focus:text-forest-950"
      >
        Bỏ qua điều hướng
      </a>
      {content.announcement && (
        <p className="bg-gold px-5 py-2 text-center text-[0.85rem] font-semibold text-forest-950">
          {content.announcement}
        </p>
      )}
      <SiteHeader groups={groups} left={left} right={right} phone={shop.phone} phoneHref={telHref(shop.phone)} zalo={zalo} address={shop.address} hours={shop.hours} />

      <main id="noi-dung" className="flex-1">
        {children}
      </main>

      <footer className="bg-forest-950 text-cream/80">
        <div className="container-x grid gap-12 py-16 md:grid-cols-[0.8fr_1.4fr_1fr]">
          <div>
            <Image src="/brand/logo-cream.png" alt="HT Food" width={900} height={734} className="h-28 w-auto" />
            <p className="mt-6 max-w-xs text-[0.95rem] leading-relaxed">{shop.tagline}</p>
          </div>
          <div>
            <h2 className="eyebrow text-gold">Sản phẩm</h2>
            <ul className="mt-5 columns-2 gap-x-8">
              {[...groups, right[0]].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="inline-flex min-h-10 items-center transition-colors duration-200 hover:text-gold-soft">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="eyebrow text-gold">Cửa hàng</h2>
            <address className="mt-5 space-y-1 not-italic">
              <a
                href={mapLink(shop.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-10 items-center leading-relaxed transition-colors duration-200 hover:text-gold-soft"
              >
                {shop.address}
              </a>
              <a href={telHref(shop.phone)} className="flex min-h-10 items-center transition-colors duration-200 hover:text-gold-soft">
                Điện thoại / Zalo: {shop.phone}
              </a>
              {shop.hours && <p className="flex min-h-10 items-center">{shop.hours}</p>}
              {facebook && (
                <a href={facebook} target="_blank" rel="noopener noreferrer" className="flex min-h-10 items-center transition-colors duration-200 hover:text-gold-soft">
                  Facebook
                </a>
              )}
              {messenger && (
                <a href={messenger} target="_blank" rel="noopener noreferrer" className="flex min-h-10 items-center transition-colors duration-200 hover:text-gold-soft">
                  Messenger
                </a>
              )}
            </address>
          </div>
        </div>
        <div className="border-t border-cream/10">
          <p className="container-x py-6 text-[0.82rem] text-cream/55">
            © HT Food – Trái Cây Bánh Kẹo Nhập Khẩu Xuân Lộc
          </p>
        </div>
      </footer>

      {zaloGroup && <DealCard href={zaloGroup} />}

      {/* Các nút liên hệ tròn (Facebook, Zalo, gọi), neo ở mép phải và đi theo khi cuộn trang */}
      <div className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-30 flex flex-col gap-3 sm:right-6">
        {facebook && (
          <a
            href={facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Trang Facebook của HT Food"
            title="Facebook"
            className="flex size-12 items-center justify-center rounded-full bg-[#1877f2] text-white shadow-[0_10px_24px_-8px_rgb(24_80_200/0.65)] ring-2 ring-white transition-transform duration-200 hover:scale-110"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z" />
            </svg>
          </a>
        )}
        {zalo && (
          <a
            href={zalo}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nhắn Zalo cho HT Food"
            title="Nhắn Zalo"
            className="flex size-12 items-center justify-center rounded-full bg-[#0068ff] text-[0.8rem] font-extrabold tracking-tight text-white shadow-[0_10px_24px_-8px_rgb(0_60_160/0.65)] ring-2 ring-white transition-transform duration-200 hover:scale-110"
          >
            Zalo
          </a>
        )}
        <a
          href={telHref(shop.phone)}
          aria-label={`Gọi cửa hàng ${shop.phone}`}
          title={`Gọi ${shop.phone}`}
          className="flex size-12 items-center justify-center rounded-full bg-forest-600 text-white shadow-[0_10px_24px_-8px_rgb(7_47_15/0.7)] ring-2 ring-white transition-transform duration-200 hover:scale-110"
        >
          <PhoneIcon />
        </a>
      </div>
    </>
  );
}
