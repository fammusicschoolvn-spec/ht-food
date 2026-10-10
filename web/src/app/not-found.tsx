import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-forest-900 px-5 py-28 text-center text-cream">
      <p className="eyebrow text-gold">Lỗi 404</p>
      <h1 className="display mt-5 text-[clamp(2.2rem,5vw,3.6rem)] leading-tight">Không tìm thấy trang này.</h1>
      <p className="mt-4 max-w-md text-cream/75">Có thể mẫu quà đã được gỡ hoặc đường dẫn bị sai.</p>
      <Link href="/san-pham" className="btn btn-gold mt-9">
        Xem các mẫu quà
      </Link>
    </main>
  );
}
