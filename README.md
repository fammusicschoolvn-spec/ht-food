# HT Food – Trái Cây Bánh Kẹo Nhập Khẩu Xuân Lộc

Website bán giỏ quà, hộp quà trái cây nhập khẩu và bánh kẹo ngoại, có trang quản trị để đăng sản phẩm và sửa nội dung.

- Mã nguồn: `web/` (Next.js 16, Tailwind 4, TypeScript).
- Ảnh gốc cửa hàng gửi: `hình ảnh sản phẩm.zip`.

## Chạy thử

Launch config `ht-food` (cổng 5550), hoặc:

```bash
npm --prefix "C:\claue code\HT Food\web" run dev -- -p 5550
```

- Trang khách: http://localhost:5550
- Trang quản trị: http://localhost:5550/admin

## Mật khẩu quản trị

Đặt trong `web/.env.local` (file này không đưa lên GitHub):

- `ADMIN_PASSWORD`: mật khẩu đăng nhập `/admin`. Đổi thành mật khẩu của bạn rồi chạy lại web.
- `SESSION_SECRET`: chuỗi ngẫu nhiên từ 32 ký tự, dùng để ký phiên đăng nhập.

Nhập sai 5 lần trong 10 phút thì bị khóa đăng nhập 10 phút.

## Trang quản trị làm được gì

- **Sản phẩm**: đăng mới, sửa, xóa, ẩn/hiện, đánh dấu nổi bật, tối đa 8 ảnh mỗi sản phẩm (ảnh tự thu nhỏ và chuyển sang WebP).
- **Danh mục**: thêm, đổi tên, xóa (chỉ xóa được khi không còn sản phẩm).
- **Nội dung & liên hệ**: tên, địa chỉ, điện thoại, giờ mở cửa, đường dẫn Zalo / Facebook / Messenger, dải thông báo, chữ và ảnh phần mở đầu trang chủ, phần giới thiệu, ba bước đặt quà. Kênh liên hệ nào để trống thì nút đó tự ẩn.

- **Tự chọn hộp quà**: sửa danh sách kiểu hộp và loại trái cây, bánh kẹo khách được chọn (trang `/tu-chon-hop-qua`).

Lưu xong là trang khách đổi ngay.

## Dữ liệu

- Dữ liệu ban đầu: `web/src/lib/seed.ts` (27 mẫu dựng từ bộ ảnh; tên và mô tả là bản nháp theo ảnh).
- Khi sửa trong trang quản trị, dữ liệu ghi vào `web/data/db.json`, ảnh tải lên nằm ở `web/data/uploads/`. Xóa thư mục `web/data` là trở về dữ liệu ban đầu.
- Toàn bộ việc đọc/ghi đi qua `web/src/lib/store.ts`.

## Trước khi đưa lên mạng

Kho dữ liệu hiện tại là file trên ổ đĩa nên **chỉ chạy được trên máy hoặc máy chủ có ổ đĩa ghi được**. Vercel không cho ghi file, vì vậy trước khi triển khai lên Vercel cần viết lại `store.ts` để lưu vào Supabase (bảng + Storage), giữ nguyên ba hàm `readDb`, `mutateDb`, `saveUpload`.

## Thiết kế

- Màu lấy từ ảnh sản phẩm: xanh logo `#116426`, xanh đậm của nhãn giá `#072f0f`, vàng viền nhãn `#c5a253`, nền kem `#fbf8ef`. Khai báo ở `web/src/app/globals.css`.
- Bố cục theo mẫu Vegi Mart chủ cửa hàng gửi: nền sáng, logo giữa với menu hai bên, tiêu đề đậm không chân, tiêu đề mục căn giữa.
- Chữ: Be Vietnam Pro (tiêu đề) + Manrope (nội dung), đều có tiếng Việt.
- Nhãn giá xanh viền vàng có chiếc lá (`components/price-tag.tsx`) làm theo nhãn trên ảnh của cửa hàng.
- Nội dung không bịa: không ghi xuất xứ, cam kết giao hàng hay đánh giá khi cửa hàng chưa cung cấp.
