import Image from "next/image";

/**
 * Ảnh sản phẩm. Ảnh từ KiotViet hoặc Supabase đã nằm trên CDN nên tải thẳng, không qua bộ tối ưu ảnh của Vercel
 * (gói miễn phí giới hạn số ảnh xử lý mỗi tháng). Món chưa có ảnh hiện khung "đang cập nhật ảnh".
 */
export function ProductImage({
  src,
  alt,
  sizes,
  priority = false,
  className = "object-cover",
}: {
  src: string | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (!src) {
    return (
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ivory text-forest-600/60">
        <Image src="/brand/mark-green.png" alt="" width={400} height={280} className="h-[22%] w-auto opacity-40" />
        <span className="px-2 text-center text-[0.75rem] font-medium text-muted">Đang cập nhật ảnh</span>
      </span>
    );
  }
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} unoptimized={src.startsWith("http")} className={className} />;
}
