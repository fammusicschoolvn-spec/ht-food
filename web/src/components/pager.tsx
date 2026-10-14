import Link from "next/link";

/** Thanh chia trang: luôn có trang đầu, trang cuối và hai trang quanh trang đang xem. */
export function Pager({ page, pages, href }: { page: number; pages: number; href: (page: number) => string }) {
  if (pages <= 1) return null;
  const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const cell =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-3 text-[0.92rem] font-semibold tabular-nums transition-colors duration-200";
  return (
    <nav aria-label="Chia trang" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} className={`${cell} border-line bg-white hover:border-forest-700`} rel="prev">
          ‹ Trước
        </Link>
      )}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-2">
          {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
          {n === page ? (
            <span aria-current="page" className={`${cell} border-forest-800 bg-forest-800 text-cream`}>
              {n}
            </span>
          ) : (
            <Link href={href(n)} className={`${cell} border-line bg-white hover:border-forest-700`}>
              {n}
            </Link>
          )}
        </span>
      ))}
      {page < pages && (
        <Link href={href(page + 1)} className={`${cell} border-line bg-white hover:border-forest-700`} rel="next">
          Sau ›
        </Link>
      )}
    </nav>
  );
}
