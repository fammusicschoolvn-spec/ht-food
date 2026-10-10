import { safeUrl, telHref } from "@/lib/format";
import type { Content } from "@/lib/types";
import { ChatIcon, FacebookIcon, PhoneIcon } from "./icons";

/** Các nút liên hệ. Kênh nào chưa có đường dẫn thì tự ẩn. */
export function ContactButtons({ shop, tone = "light" }: { shop: Content["shop"]; tone?: "light" | "dark" }) {
  const zalo = safeUrl(shop.zalo);
  const messenger = safeUrl(shop.messenger);
  const facebook = safeUrl(shop.facebook);
  const line = tone === "dark" ? "btn-line-light" : "btn-line";
  return (
    <div className="flex flex-wrap gap-3">
      {zalo && (
        <a href={zalo} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
          <ChatIcon />
          Đặt qua Zalo
        </a>
      )}
      <a href={telHref(shop.phone)} className={`btn ${zalo ? line : "btn-gold"}`}>
        <PhoneIcon />
        Gọi {shop.phone}
      </a>
      {messenger && (
        <a href={messenger} target="_blank" rel="noopener noreferrer" className={`btn ${line}`}>
          <ChatIcon />
          Messenger
        </a>
      )}
      {facebook && (
        <a href={facebook} target="_blank" rel="noopener noreferrer" className={`btn ${line}`}>
          <FacebookIcon />
          Facebook
        </a>
      )}
    </div>
  );
}
