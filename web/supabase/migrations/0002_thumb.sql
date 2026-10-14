-- Ảnh thu nhỏ cho danh sách sản phẩm (ảnh gốc từ KiotViet khá nặng).
alter table public.products add column if not exists thumb text not null default '';
