"""Điền cột search (tên + mã hàng không dấu) cho mọi sản phẩm trên Supabase. Chạy một lần sau migration 0003."""

import io
import json
import os
import re
import sys
import unicodedata
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")
WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
vals = {}
for line in io.open(os.path.join(WEB, ".env.local"), encoding="utf-8"):
    if "=" in line and not line.lstrip().startswith("#"):
        k, v = line.split("=", 1)
        vals[k.strip()] = v.strip()
URL, KEY = vals["SUPABASE_URL"].rstrip("/"), vals["SUPABASE_SECRET_KEY"]
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "User-Agent": "ht-food-search", "Content-Type": "application/json"}


def slugify(text: str) -> str:  # giống slugify trong src/lib/format.ts
    t = text.lower().replace("đ", "d")
    t = unicodedata.normalize("NFD", t)
    t = "".join(ch for ch in t if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:80]


rows, start = [], 0
while True:
    req = urllib.request.Request(f"{URL}/rest/v1/products?select=*&order=id", headers={**H, "Range": f"{start}-{start + 999}"})
    page = json.load(urllib.request.urlopen(req, timeout=60))
    rows += page
    if len(page) < 1000:
        break
    start += 1000

for r in rows:
    r["search"] = slugify(f"{r['name']} {r.get('code') or ''}")
for i in range(0, len(rows), 500):
    req = urllib.request.Request(f"{URL}/rest/v1/products?on_conflict=id", data=json.dumps(rows[i:i + 500]).encode(), method="POST",
                                 headers={**H, "Prefer": "resolution=merge-duplicates,return=minimal"})
    urllib.request.urlopen(req, timeout=120)
    print(f"  {min(i + 500, len(rows))}/{len(rows)}", flush=True)
print("Xong.")
