import Image from "next/image";
import Link from "next/link";
import { ChatIcon, PhoneIcon } from "@/components/icons";
import { SiteHeader } from "@/components/site-header";
import { childrenOf, topLevel } from "@/lib/categories";
import { getCatalog } from "@/lib/data";
import { mapLink, safeUrl, telHref } from "@/lib/format";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const { categories, content } = await getCatalog();
  const { shop } = content;
  const zalo = safeUrl(shop.zalo);
  const facebook = safeUrl(shop.facebook);
  const messenger = safeUrl(shop.messenger);

  const link = (c: { slug: string; name: string }) => ({ href: `/san-pham?dm=${c.slug}`, label: c.name });
  const groups = topLevel(categories).map((g) => ({ ...link(g), children: childrenOf(categories, g.id).map(link) }));
  const left = [{ href: "/san-pham", label: "Tất cả sản phẩm" }, ...groups.slice(0, 1)];
  const right = [
    { href: "/tu-chon-hop-qua", label: "Tự chọn hộp quà" },
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

      <footer className="bg-forest-950 pb-24 text-cream/80 sm:pb-0">
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

      {/* Thanh liên hệ nhanh trên điện thoại */}
      <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-px border-t border-gold/30 bg-gold/30 pb-[env(safe-area-inset-bottom)] sm:hidden">
        <a href={telHref(shop.phone)} className="flex min-h-14 items-center justify-center gap-2 bg-forest-900 font-semibold text-cream">
          <PhoneIcon />
          Gọi cửa hàng
        </a>
        {zalo ? (
          <a href={zalo} target="_blank" rel="noopener noreferrer" className="flex min-h-14 items-center justify-center gap-2 bg-gold font-semibold text-forest-950">
            <ChatIcon />
            Nhắn Zalo
          </a>
        ) : (
          <Link href="/lien-he" className="flex min-h-14 items-center justify-center gap-2 bg-gold font-semibold text-forest-950">
            Liên hệ
          </Link>
        )}
      </div>
    </>
  );
}
