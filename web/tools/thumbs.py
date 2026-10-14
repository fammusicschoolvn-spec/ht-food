"""Tạo ảnh thu nhỏ cho các sản phẩm đang hiện trên web.

Với mỗi món đang hiện mà chưa có ảnh thu nhỏ: tải ảnh chính (thường là ảnh KiotViet của cửa hàng),
thu về cạnh dài 480px, lưu WebP vào kho "media" trên Supabase (thư mục thumbs/), rồi ghi đường dẫn vào cột thumb.

  python tools/thumbs.py          # làm thật
  python tools/thumbs.py --thu    # chỉ đếm số món cần làm
  python tools/thumbs.py --tat-ca # làm cả món đang ẩn

Chạy lại bao nhiêu lần cũng được: món đã có ảnh thu nhỏ thì bỏ qua.
"""

import io
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")
WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIZE = 480


def env():
    vals = {}
    for line in io.open(os.path.join(WEB, ".env.local"), encoding="utf-8"):
        if "=" in line and not line.lstrip().startswith("#"):
            k, v = line.split("=", 1)
            vals[k.strip()] = v.strip().strip('"')
    return vals["SUPABASE_URL"].rstrip("/"), vals["SUPABASE_SECRET_KEY"]


URL, KEY = env()
AUTH = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "User-Agent": "ht-food-thumbs"}


def api(method, path, body=None, headers=None, raw=False):
    data = body if raw else (json.dumps(body).encode() if body is not None else None)
    h = {**AUTH, **({} if raw else {"Content-Type": "application/json"}), **(headers or {})}
    req = urllib.request.Request(f"{URL}{path}", data=data, method=method, headers=h)
    with urllib.request.urlopen(req, timeout=60) as res:
        out = res.read()
        return json.loads(out) if out and not raw else out


def todo(all_items):
    out, start = [], 0
    filt = "" if all_items else "&visible=is.true"
    while True:
        page = api("GET", f"/rest/v1/products?select=id,images,thumb&thumb=eq.{filt}&order=id", headers={"Range": f"{start}-{start + 999}"})
        out += [p for p in page if p["images"]]
        if len(page) < 1000:
            return out
        start += 1000


def make(p):
    src = p["images"][0]
    try:
        if src.startswith("/"):
            return p["id"], "bỏ qua (ảnh có sẵn trong web)"
        req = urllib.request.Request(src, headers={"User-Agent": "Mozilla/5.0 ht-food-thumbs"})
        with urllib.request.urlopen(req, timeout=60) as res:
            im = Image.open(io.BytesIO(res.read()))
            im.load()
        im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
        im.thumbnail((SIZE, SIZE), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=78, method=6)
        name = "thumbs/" + urllib.parse.quote(p["id"], safe="") + ".webp"
        api("POST", f"/storage/v1/object/media/{name}", buf.getvalue(), raw=True,
            headers={"Content-Type": "image/webp", "x-upsert": "true", "Cache-Control": "max-age=31536000"})
        public = f"{URL}/storage/v1/object/public/media/{name}"
        api("PATCH", f"/rest/v1/products?id=eq.{urllib.parse.quote(p['id'])}", {"thumb": public}, headers={"Prefer": "return=minimal"})
        return p["id"], f"{len(buf.getvalue()) // 1024}KB"
    except (urllib.error.URLError, OSError, ValueError) as e:
        return p["id"], f"LỖI {e}"


def main():
    items = todo("--tat-ca" in sys.argv)
    print(f"Cần làm ảnh thu nhỏ: {len(items)} món")
    if "--thu" in sys.argv or not items:
        return
    done = errors = 0
    with ThreadPoolExecutor(max_workers=8) as pool:
        for i, (pid, result) in enumerate(pool.map(make, items), 1):
            if result.startswith("LỖI"):
                errors += 1
                print(f"  {pid}: {result}", flush=True)
            else:
                done += 1
            if i % 100 == 0 or i == len(items):
                print(f"  {i}/{len(items)} (lỗi {errors})", flush=True)
    print(f"Xong: {done} món có ảnh thu nhỏ, {errors} món lỗi (chạy lại để thử lại các món lỗi).")


if __name__ == "__main__":
    main()
