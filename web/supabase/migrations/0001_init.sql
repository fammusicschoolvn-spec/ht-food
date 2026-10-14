-- HT Food: bảng dữ liệu cho web.
-- Chỉ máy chủ của web (dùng khóa bí mật) được đọc ghi; khách và trình duyệt không truy cập thẳng.

create table if not exists public.categories (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text not null default '',
  parent_id text references public.categories (id) on delete restrict,
  image text not null default '',
  sort integer not null default 0
);

create table if not exists public.products (
  id text primary key,
  slug text not null unique,
  name text not null,
  category_id text not null references public.categories (id) on delete restrict,
  price_min bigint not null default 0,
  price_label text not null default '',
  description text not null default '',
  images jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  code text,
  stock numeric
);

create index if not exists products_created_at_idx on public.products (created_at desc);
create index if not exists products_category_idx on public.products (category_id);

create table if not exists public.site_content (
  id integer primary key default 1 check (id = 1),
  data jsonb not null
);

-- Bật RLS và không tạo policy nào: khóa anon/authenticated không đọc ghi được.
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.site_content enable row level security;
revoke all on table public.categories, public.products, public.site_content from anon, authenticated;

-- Kho ảnh do trang quản trị tải lên: ai cũng xem được ảnh, chỉ máy chủ được tải lên / xóa.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 8388608, array['image/webp'])
on conflict (id) do nothing;
