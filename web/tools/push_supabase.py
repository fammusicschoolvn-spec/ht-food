"""Đẩy dữ liệu lên Supabase: danh mục, sản phẩm (27 mẫu quà + hàng KiotViet) và nội dung trang.

Chạy sau khi đã:
  1. Chạy supabase/migrations/0001_init.sql trong SQL Editor của project.
  2. Có SUPABASE_URL và SUPABASE_SECRET_KEY trong web/.env.local.
  3. Chạy tools/kiotviet.py "<file.xlsx>" --local để có data/kiotviet.json và data/db.json.

  python tools/push_supabase.py            # chạy thật
  python tools/push_supabase.py --thu      # chỉ in ra sẽ làm gì

Nhập lại file Excel mới về sau: sản phẩm đã có trên web chỉ được cập nhật giá, tồn kho và ẩn/hiện;
tên, danh mục, mô tả, ảnh mà nhân viên đã sửa trên web được giữ nguyên.
"""

import io
import json
import os
import sys
import urllib.error
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")
WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRY = "--thu" in sys.argv


def env():
    vals = {}
    for line in io.open(os.path.join(WEB, ".env.local"), encoding="utf-8"):
        if "=" in line and not line.lstrip().startswith("#"):
            k, v = line.split("=", 1)
            vals[k.strip()] = v.strip().strip('"')
    url, key = vals.get("SUPABASE_URL", "").rstrip("/"), vals.get("SUPABASE_SECRET_KEY", "")
    if not url or not key:
        sys.exit("Thiếu SUPABASE_URL hoặc SUPABASE_SECRET_KEY trong web/.env.local")
    return url, key


URL, KEY = env()


def call(method, path, body=None, prefer=None, rng=None):
    headers = {
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Content-Type": "application/json",
        # Supabase từ chối khóa bí mật nếu yêu cầu trông như đến từ trình duyệt.
        "User-Agent": "ht-food-import",
    }
    if prefer:
        headers["Prefer"] = prefer
    if rng:
        headers["Range"] = rng
    data = json.dumps(body, ensure_ascii=False).encode("utf-8") if body is not None else None
    req = urllib.request.Request(f"{URL}{path}", data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=120) as res:
            raw = res.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        sys.exit(f"Supabase báo lỗi {e.code} ở {method} {path}: {e.read().decode('utf-8', 'replace')[:400]}")


def fetch_all(table, select):
    out, start = [], 0
    while True:
        page = call("GET", f"/rest/v1/{table}?select={select}&order=id", rng=f"{start}-{start + 999}")
        out += page
        if len(page) < 1000:
            return out
        start += 1000


def upsert(table, rows, size=500):
    for i in range(0, len(rows), size):
        if not DRY:
            call("POST", f"/rest/v1/{table}?on_conflict=id", rows[i:i + size], prefer="resolution=merge-duplicates,return=minimal")
        print(f"  {table}: {min(i + size, len(rows))}/{len(rows)}")


def main():
    kv = json.load(io.open(os.path.join(WEB, "data", "kiotviet.json"), encoding="utf-8"))
    db = json.load(io.open(os.path.join(WEB, "data", "db.json"), encoding="utf-8"))

    cats = [
        {"id": c["id"], "slug": c["slug"], "name": c["name"], "description": c.get("description", ""),
         "parent_id": c.get("parentId"), "image": c.get("image", ""), "sort": i}
        for i, c in enumerate(kv["categories"])
    ]
    existing_cats = {c["id"] for c in fetch_all("categories", "id")}
    new_cats = [c for c in cats if c["id"] not in existing_cats]
    # Nhóm lớn trước, danh mục con sau (danh mục con trỏ tới nhóm lớn).
    new_cats.sort(key=lambda c: c["parent_id"] is not None)
    print(f"Danh mục: {len(new_cats)} mới, {len(cats) - len(new_cats)} đã có (giữ nguyên)")
    upsert("categories", new_cats)

    def row(p):
        return {
            "id": p["id"], "slug": p["slug"], "name": p["name"], "category_id": p["categoryId"],
            "price_min": p["priceMin"], "price_label": p["priceLabel"], "description": p.get("description", ""),
            "images": p.get("images", []), "featured": p.get("featured", False), "visible": p.get("visible", True),
            "created_at": p["createdAt"], "code": p.get("code"), "stock": p.get("stock"),
        }

    gifts = [row(p) for p in db.get("products", []) if not p["id"].startswith("kv-")]
    imported = [row(p) for p in kv["products"]]
    existing = {p["id"]: p for p in fetch_all("products", "id,slug")}

    fresh = [p for p in gifts + imported if p["id"] not in existing]
    taken = {p["slug"] for p in existing.values()}
    for p in fresh:  # tránh trùng đường dẫn với món đã có
        base, n = p["slug"], 2
        while p["slug"] in taken:
            p["slug"], n = f"{base}-{n}", n + 1
        taken.add(p["slug"])
    print(f"Sản phẩm mới: {len(fresh)}")
    upsert("products", fresh)

    updates = [p for p in imported if p["id"] in existing]
    print(f"Sản phẩm đã có, cập nhật giá / tồn kho / ẩn hiện: {len(updates)}")
    for i, p in enumerate(updates):
        if not DRY:
            call("PATCH", f"/rest/v1/products?id=eq.{urllib.parse.quote(p['id'])}",
                 {"price_min": p["price_min"], "price_label": p["price_label"], "stock": p["stock"], "visible": p["visible"], "code": p["code"]},
                 prefer="return=minimal")
        if (i + 1) % 200 == 0 or i + 1 == len(updates):
            print(f"  cập nhật: {i + 1}/{len(updates)}")

    has_content = call("GET", "/rest/v1/site_content?select=id&id=eq.1")
    if has_content:
        print("Nội dung trang: đã có trên Supabase, giữ nguyên")
    else:
        print("Nội dung trang: tạo mới từ data/db.json")
        if not DRY:
            call("POST", "/rest/v1/site_content", {"id": 1, "data": db["content"]}, prefer="return=minimal")
    print("Xong." + (" (chạy thử, chưa ghi gì)" if DRY else ""))


if __name__ == "__main__":
    import urllib.parse  # noqa: E402
    main()
