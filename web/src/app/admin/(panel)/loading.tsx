export default function Loading() {
  return (
    <div className="flex items-center gap-3 py-10 text-muted" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-line border-t-forest-700" aria-hidden />
      Đang tải…
    </div>
  );
}
