"""Đọc file Excel xuất từ KiotViet (Danh sách sản phẩm) và đổi sang dữ liệu của web.

Chạy:  python tools/kiotviet.py "<file.xlsx>"  -> ghi data/kiotviet.json
Rồi:   python tools/kiotviet.py "<file.xlsx>" --local  -> ghi thẳng vào data/db.json (bản chạy trên máy)

Quy tắc:
- Mỗi dòng là một sản phẩm, mã sản phẩm trên web = "kv-" + Mã hàng (nhập lại file thì cập nhật đúng món cũ).
- Hiện trên web khi còn tồn kho và có giá bán; còn lại nhập vào nhưng ẩn, bật lên trong trang quản trị.
- Danh mục: xếp theo từ khóa trong tên hàng trước, không khớp thì theo "Nhóm hàng" của KiotViet.
- Ảnh: dùng luôn link ảnh trên KiotViet.
"""

import io
import json
import os
import re
import sys
import unicodedata
from datetime import datetime, timedelta, timezone

import openpyxl

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.dirname(HERE)


def slugify(text: str) -> str:
    t = text.lower().replace("đ", "d")
    t = unicodedata.normalize("NFD", t)
    t = "".join(ch for ch in t if unicodedata.category(ch) != "Mn")
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t[:80]


# ---------------- Cây danh mục (giống web/src/lib/seed.ts) ----------------

GROUPS = [
    ("Giỏ & hộp quà", ["Giỏ quà trái cây", "Hộp quà trái cây", "Hộp, giỏ & phụ kiện quà"], "/categories/gio-hop-qua.webp"),
    ("Đồ uống", ["Nước ngọt", "Nước tăng lực", "Nước ion kiềm", "Nước sâm", "Sữa trái cây", "Sữa hạt"], "/categories/do-uong.webp"),
    ("Bia & Rượu", ["Bia", "Rượu"], "/categories/bia-ruou.webp"),
    ("Sâm & Yến", ["Yến", "Cao sâm"], "/categories/sam-yen.webp"),
    ("Bánh", ["Bánh quy", "Bánh bông lan", "Bánh quế", "Bánh gấu", "Bánh Thái"], "/categories/banh.webp"),
    ("Kẹo & Socola", ["Socola", "Kẹo dẻo", "Kẹo sữa", "Kẹo mút", "Kẹo ngậm"], "/categories/keo-socola.webp"),
    ("Snack & Đồ ăn vặt", ["Snack", "Cơm cháy", "Rong biển ăn liền", "Khô bò", "Sữa chua sấy"], "/categories/snack-do-an-vat.webp"),
    ("Trái cây", ["Trái cây tươi", "Trái cây sấy"], "/categories/trai-cay-3.webp"),
    ("Thạch & Rau câu", ["Thạch tổng hợp", "Rau câu trái cây"], "/categories/thach-rau-cau.webp"),
    ("Ngũ cốc", ["Ngũ cốc ăn kiêng", "Ngũ cốc tăng cân"], "/categories/ngu-coc.webp"),
    ("Thực phẩm khô & Đồ hộp", ["Mì ăn liền", "Thịt hộp", "Gia vị", "Phô mai"], "/categories/thuc-pham-kho-do-hop.webp"),
    ("Hóa phẩm gia dụng", ["Viên giặt quần áo"], "/categories/hoa-pham-gia-dung.webp"),
    ("Hàng khác", [], ""),
]
DESCRIPTIONS = {
    "Giỏ quà trái cây": "Giỏ trái cây nhập khẩu bọc lưới, thắt nơ, hợp để biếu tặng và thăm hỏi.",
    "Hộp quà trái cây": "Hộp và khay trái cây sắp sẵn, gọn gàng, nhiều mức giá.",
    "Hộp, giỏ & phụ kiện quà": "Hộp, giỏ, vali, túi để tự gói quà.",
    "Kẹo ngậm": "Gồm kẹo Ricola, kẹo sâm.",
    "Trái cây sấy": "Gồm nho khô.",
    "Hàng khác": "Hàng đông lạnh, đồ chơi và các mặt hàng khác.",
}
FIXED_IDS = {"Giỏ quà trái cây": "c-gio", "Hộp quà trái cây": "c-hop"}


def build_categories():
    cats = []
    for name, children, image in GROUPS:
        pid = f"c-{slugify(name)}"
        cats.append({"id": pid, "slug": slugify(name), "name": name, "description": DESCRIPTIONS.get(name, ""), "parentId": None, "image": image})
        for child in children:
            cats.append({
                "id": FIXED_IDS.get(child, f"c-{slugify(child)}"),
                "slug": slugify(child),
                "name": child,
                "description": DESCRIPTIONS.get(child, ""),
                "parentId": pid,
                "image": "",
            })
    return cats


C = lambda name: FIXED_IDS.get(name, f"c-{slugify(name)}")  # mã danh mục theo tên

# ---------------- Xếp danh mục ----------------

FRUIT_WORDS = r"(xoai|nho|tao|le|cam|kiwi|dau|chuoi|mit|man|me|oi|thanh long|du du|dua|vai|nhan|chanh|buoi|chery|cherry|viet quat|chà là|cha la|kho qua|hong|mo|xi muoi|o mai|omai)"

# Tên hàng tiếng Việt thường mở đầu bằng loại hàng ("Bánh…", "Kẹo…", "Nước…"): xét chữ đầu trước.
def by_first_words(n: str):
    head = n.strip()
    starts = lambda *ws: any(head.startswith(w + " ") or head == w for w in ws)
    if re.search(r"\bsay\b", n) and re.search(r"\b" + FRUIT_WORDS + r"\b", n) and not starts("banh", "keo", "sua", "nuoc"):
        return C("Trái cây sấy")
    if starts("nho kho", "o mai", "omai", "xi muoi", "mut"):
        return C("Trái cây sấy")
    if starts("banh"):
        for pat, cat in [
            (r"\bbanh gau\b", "Bánh gấu"),
            (r"\b(que|xop|wafer)\b", "Bánh quế"),
            (r"\b(bong lan|cake|banh bong|bong)\b", "Bánh bông lan"),
            (r"\b(quy|qui|cookie|cookies|biscuit|biscuits|cracker|crackers|danisa|bo)\b", "Bánh quy"),
            (r"\bthai\b", "Bánh Thái"),
        ]:
            if re.search(pat, n):
                return C(cat)
        return C("Bánh")
    if starts("keo"):
        for pat, cat in [
            (r"\b(ricola|ngam|gung|ho|sam)\b", "Kẹo ngậm"),
            (r"\b(socola|chocolate|choco)\b", "Socola"),
            (r"\b(deo|gummy|gummies|haribo|marshmallow)\b", "Kẹo dẻo"),
            (r"\bsua\b", "Kẹo sữa"),
            (r"\b(mut|lollipop|chupa)\b", "Kẹo mút"),
        ]:
            if re.search(pat, n):
                return C(cat)
        return C("Kẹo & Socola")
    if starts("socola", "chocolate", "choco", "sô cô la"):
        return C("Socola")
    if starts("mi", "my", "mien", "mien", "ramen", "udon", "thung mi", "loc mi"):
        return C("Mì ăn liền")
    if starts("thach", "rau cau"):
        return C("Rau câu trái cây") if re.search(r"\brau cau\b", n) else C("Thạch tổng hợp")
    if starts("hat nem"):
        return C("Gia vị")
    if starts("hat", "macca", "hanh nhan", "oc cho", "dieu", "hat de", "dau phong"):
        return C("Ngũ cốc")
    if starts("ngu coc", "yen mach", "granola"):
        if re.search(r"\btang can\b", n):
            return C("Ngũ cốc tăng cân")
        if re.search(r"\b(an kieng|giam can|keto|it duong|khong duong)\b", n):
            return C("Ngũ cốc ăn kiêng")
        return C("Ngũ cốc")
    if starts("thit hop", "pate", "pa te", "ca hop"):
        return C("Thịt hộp")
    if starts("pho mai", "cheese"):
        return C("Phô mai")
    if starts("muoi", "sot", "tuong", "nuoc mam", "dau an", "dau oliu", "hat nem", "gia vi", "bot nem", "giam"):
        return C("Gia vị")
    if starts("com chay"):
        return C("Cơm cháy")
    if starts("rong bien"):
        return C("Rong biển ăn liền")
    if starts("snack"):
        return C("Snack")
    if starts("bia"):
        return C("Bia")
    if starts("ruou", "vang"):
        return C("Rượu")
    if starts("nuoc", "tra", "ca phe", "cafe", "sua", "thung nuoc", "loc sua", "thung sua"):
        for pat, cat in [
            (r"\bsua chua say\b", "Sữa chua sấy"),
            (r"\b(tang luc|red bull|redbull|monster|sting|warrior)\b", "Nước tăng lực"),
            (r"\b(ion kiem|ion|pocari|aquarius)\b", "Nước ion kiềm"),
            (r"\bnuoc sam\b", "Nước sâm"),
            (r"\b(sua hat|oc cho|hanh nhan|sua dau|sua gao|yen mach|macca)\b", "Sữa hạt"),
            (r"\bsua\b.*\b(trai cay|dau|chuoi|xoai|cam|nho|dua|tao)\b", "Sữa trái cây"),
            (r"\b(nuoc ngot|coca|pepsi|soda|7up|fanta|sprite|co ga|sarsi|schweppes|pepper)\b", "Nước ngọt"),
        ]:
            if re.search(pat, n):
                return C(cat)
        return C("Đồ uống")
    return None


# (từ khóa trong tên đã bỏ dấu, danh mục): dùng khi chữ đầu không cho biết loại hàng. Xét từ trên xuống.
NAME_RULES = [
    (r"\bvien giat\b", C("Viên giặt quần áo")),
    (r"\b(nuoc giat|nuoc xa|kem danh rang|ban chai|giay thom|nuoc rua|xa phong|khan uot|giay ve sinh|tay trang|chong muoi)\b", C("Hóa phẩm gia dụng")),
    (r"\bnuoc sam\b", C("Nước sâm")),
    (r"\byen\b(?! mach)", C("Yến")),
    (r"\bkeo sam\b", C("Kẹo ngậm")),
    (r"\b(cao sam|tinh chat sam|hong sam|sam han|nhan sam|sam tuoi|tra sam)\b", C("Cao sâm")),
    (r"\b(ricola|keo ngam|keo gung)\b", C("Kẹo ngậm")),
    (r"\b(socola|chocolate|choco|cacao|ferrero|kinder|toblerone|ritter)\b", C("Socola")),
    (r"\b(keo deo|gummy|gummies|haribo|marshmallow)\b", C("Kẹo dẻo")),
    (r"\bkeo sua\b", C("Kẹo sữa")),
    (r"\b(keo mut|lollipop|chupa)\b", C("Kẹo mút")),
    (r"\bcom chay\b", C("Cơm cháy")),
    (r"\brong bien\b", C("Rong biển ăn liền")),
    (r"\b(kho bo|bo kho)\b", C("Khô bò")),
    (r"\bsua chua say\b", C("Sữa chua sấy")),
    (r"\b(snack|chips|khoai tay chien|bim bim|pringles|lays|oishi|bap rang|popcorn)\b", C("Snack")),
    (r"\brau cau\b", C("Rau câu trái cây")),
    (r"\b(thach|jele|jelly)\b", C("Thạch tổng hợp")),
    (r"\b(cookie|cookies|biscuit|biscuits|cracker|crackers|danisa)\b", C("Bánh quy")),
    (r"\b(wafer)\b", C("Bánh quế")),
    (r"\btang can\b", C("Ngũ cốc tăng cân")),
    (r"\b(ngu coc|yen mach|granola|oats|muesli|quaker)\b", C("Ngũ cốc")),
    (r"\b(macca|hanh nhan|oc cho|hat dieu|hat de|hat mix|hat chia)\b", C("Ngũ cốc")),
    (r"\b(samyang|ramen|udon|mama|mi goi|mi ly|mi tron)\b", C("Mì ăn liền")),
    (r"\b(thit hop|pate|spam|luncheon|ca ngu hop)\b", C("Thịt hộp")),
    (r"\b(pho mai|cheese)\b", C("Phô mai")),
    (r"\b(gia vi|nuoc mam|dau an|dau oliu|hat nem)\b", C("Gia vị")),
    (r"\b(tang luc|red bull|redbull|monster|sting)\b", C("Nước tăng lực")),
    (r"\b(pocari|aquarius)\b", C("Nước ion kiềm")),
    (r"\b(coca|pepsi|soda|7up|fanta|sprite|sarsi|schweppes)\b", C("Nước ngọt")),
    (r"\b(beer|heineken|tiger|sapporo|budweiser|corona|hoegaarden)\b", C("Bia")),
    (r"\b(ruou|wine|soju|whisky|whiskey|sake|vodka|champagne|chivas|hennessy|brandy)\b", C("Rượu")),
    (r"\b(milo|sua bot|ensure|glucerna|ca phe|cafe|coffee)\b", C("Đồ uống")),
]

# Nhóm hàng con của KiotViet (phần sau ">>") -> danh mục, khi tên hàng không cho biết.
SUBGROUP_RULES = {
    "NHO NHẬP": C("Trái cây tươi"),
    "BIA & RƯỢU CÁC LOẠI": C("Bia & Rượu"),
    "SỮA & BỘT PHA CÁC LOẠI": C("Đồ uống"),
    "NƯỚC TRÁI ÉP CÂY CÁC LOẠI": C("Đồ uống"),
    "NƯỚC NGỌT CÁC LOẠI": C("Nước ngọt"),
    "THẠCH TRÁI CÂY NHẬP": C("Thạch tổng hợp"),
    "NGŨ CỐC & CÁC LOẠI HẠT": C("Ngũ cốc"),
    "GIA VỊ": C("Gia vị"),
    "NƯỚC GIẶT & KEM ĐÁNH RĂNG": C("Hóa phẩm gia dụng"),
    "YẾN NHẬP KHẨU CÁC LOẠI": C("Yến"),
    "SÂM NHẬP KHẨU CÁC LOẠI": C("Cao sâm"),
    "MÌ GÓI CÁC LOẠI": C("Mì ăn liền"),
    "SOCOLA ( CÁC LOẠI )": C("Socola"),
    "RONG BIỂN": C("Rong biển ăn liền"),
    "KẸO NHẬP": C("Kẹo & Socola"),
    "BÁNH NHẬP": C("Bánh"),
}
# Nhóm hàng lớn -> danh mục.
TOPGROUP_RULES = [
    ("GIỎ GÓI QUÀ", C("Hộp, giỏ & phụ kiện quà")),
    ("GIỎ & PHỤ KIỆN", C("Hộp, giỏ & phụ kiện quà")),
    ("ĐỒ UỐNG", C("Đồ uống")),
    ("SÂM HÀN QUỐC & YẾN", C("Sâm & Yến")),
    ("THỰC PHẨM ĐÓNG SẴN", C("Thực phẩm khô & Đồ hộp")),
    ("ĐÔNG LẠNH", C("Hàng khác")),
    ("ĐỒ CHƠI", C("Hàng khác")),
    ("CÁC LOẠI HẠT", C("Ngũ cốc")),
    ("BÁNH KẸO", C("Snack & Đồ ăn vặt")),
]


def plain(text: str) -> str:
    return " " + slugify(text).replace("-", " ") + " "


def classify(name: str, group: str) -> str:
    n = plain(name)
    parts = [p.strip() for p in (group or "").split(">>")]
    top, sub = parts[0].upper(), (parts[1].upper() if len(parts) > 1 else "")
    if "TRÁI CÂY" in top:
        return C("Trái cây sấy") if re.search(r"\b(say|nho kho|mut)\b", n) else C("Trái cây tươi")
    if "GIỎ" in top:
        return C("Hộp, giỏ & phụ kiện quà")
    if "ĐỒ CHƠI" in top or re.search(r"\b(do choi|lego|lap ghep)\b", n):
        return C("Hàng khác")
    found = by_first_words(n)
    if found:
        return found
    for pattern, cat in NAME_RULES:
        if re.search(pattern, n):
            return cat
    for key, cat in SUBGROUP_RULES.items():
        if sub == key.upper():
            return cat
    for key, cat in TOPGROUP_RULES:
        if key in top:
            return cat
    return C("Hàng khác")


# ---------------- Tên, giá ----------------

def clean_name(name: str) -> str:
    n = re.sub(r"\(\s*(XL|LK)\s*\)", "", name, flags=re.I)
    n = re.sub(r"\s+", " ", n).strip(" -")
    return n[:1].upper() + n[1:] if n else n


def money(n: int) -> str:
    return f"{n:,}".replace(",", ".") + "đ"


def price_label(name: str, price: int) -> str:
    if price <= 0:
        return "Liên hệ"
    per_kg = re.search(r"\bkg\b", plain(name)) and not re.search(r"\d\s*kg", name, re.I)
    return f"{money(price)} / kg" if per_kg else money(price)


# Vật tư dùng để gói quà, không bán lẻ cho khách.
SUPPLIES = r"\b(ruy bang|sung ban keo|keo nen|bang keo|hoa thuoc duoc|hoa gia|giay kraft|day buoc|xop no|luot quay)\b"


def load(path: str):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    rows = list(wb.worksheets[0].iter_rows(values_only=True))
    head = rows[0]
    return [dict(zip(head, r)) for r in rows[1:] if any(r)]


def convert(path: str):
    rows = load(path)
    cats = build_categories()
    base = datetime(2026, 10, 13, tzinfo=timezone.utc)
    products, slugs = [], set()
    for i, r in enumerate(rows):
        code = str(r.get("Mã hàng") or "").strip()
        raw_name = str(r.get("Tên hàng") or "").strip()
        if not code or not raw_name:
            continue
        name = clean_name(raw_name)
        price = int(round(float(r.get("Giá bán") or 0)))
        stock = float(r.get("Tồn kho") or 0)
        images = [u.strip() for u in str(r.get("Hình ảnh (url1,url2...)") or "").split(",") if u.strip().startswith("https://")][:8]
        slug = slugify(name) or slugify(code)
        if slug in slugs:
            slug = f"{slug}-{slugify(code)}"[:90]
        slugs.add(slug)
        supply = bool(re.search(SUPPLIES, plain(raw_name)))
        products.append({
            "id": f"kv-{slugify(code)}",
            "slug": slug,
            "name": name,
            "categoryId": classify(raw_name, str(r.get("Nhóm hàng(3 Cấp)") or "")),
            "priceMin": price,
            "priceLabel": price_label(raw_name, price),
            "description": str(r.get("Mô tả") or "").strip()[:4000],
            "images": images,
            "featured": False,
            "visible": stock > 0 and price > 0 and not supply,
            # Giữ thứ tự trong file (món mới nhất ở trên).
            "createdAt": (base - timedelta(seconds=i)).isoformat().replace("+00:00", "Z"),
            "code": code,
            "stock": round(stock, 3),
        })
    return cats, products


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    cats, products = convert(sys.argv[1])
    out = os.path.join(WEB, "data", "kiotviet.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    io.open(out, "w", encoding="utf-8").write(json.dumps({"categories": cats, "products": products}, ensure_ascii=False))
    vis = [p for p in products if p["visible"]]
    print(f"{len(products)} sản phẩm, {len(vis)} hiện trên web -> {out}")
    names = {c["id"]: c["name"] for c in cats}
    from collections import Counter
    for cid, n in Counter(p["categoryId"] for p in vis).most_common():
        print(f"  {n:5d}  {names.get(cid, cid)}")

    if "--local" in sys.argv:
        dbp = os.path.join(WEB, "data", "db.json")
        db = json.load(io.open(dbp, encoding="utf-8")) if os.path.exists(dbp) else {}
        keep = [p for p in db.get("products", []) if not p["id"].startswith("kv-")]
        db["categories"] = cats
        db["products"] = keep + products
        io.open(dbp, "w", encoding="utf-8").write(json.dumps(db, ensure_ascii=False))
        print(f"Đã ghi {len(keep)} mẫu quà cũ + {len(products)} sản phẩm KiotViet vào {dbp}")


if __name__ == "__main__":
    main()
