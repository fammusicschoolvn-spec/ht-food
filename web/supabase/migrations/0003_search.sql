-- Cột tìm kiếm cho trang quản trị: tên + mã hàng viết không dấu (web tự điền khi lưu).
alter table public.products add column if not exists search text not null default '';
