import { slugify } from "./format";
import type { Category, Content, Db, Product } from "./types";

// Dữ liệu ban đầu, dựng từ bộ ảnh sản phẩm của cửa hàng.
// Tên và mô tả là bản nháp theo ảnh: chủ cửa hàng sửa lại trong trang quản trị.

type Group = [name: string, children: string[], image?: string];

// Nhóm lớn và danh mục con theo danh sách của cửa hàng.
const groups: Group[] = [
  ["Giỏ & hộp quà", ["Giỏ quà trái cây", "Hộp quà trái cây"]],
  ["Đồ uống", ["Nước ngọt", "Nước tăng lực", "Nước ion kiềm", "Nước sâm", "Sữa trái cây", "Sữa hạt"]],
  ["Bia & Rượu", ["Bia", "Rượu"]],
  ["Sâm & Yến", ["Yến", "Cao sâm"]],
  ["Bánh", ["Bánh quy", "Bánh bông lan", "Bánh quế", "Bánh gấu", "Bánh Thái"]],
  ["Kẹo & Socola", ["Socola", "Kẹo dẻo", "Kẹo sữa", "Kẹo mút", "Kẹo ngậm"]],
  ["Snack & Đồ ăn vặt", ["Snack", "Cơm cháy", "Rong biển ăn liền", "Khô bò", "Sữa chua sấy"]],
  ["Trái cây", ["Trái cây tươi", "Trái cây sấy"], "/hero/cam.webp"],
  ["Thạch & Rau câu", ["Thạch tổng hợp", "Rau câu trái cây"]],
  ["Ngũ cốc", ["Ngũ cốc ăn kiêng", "Ngũ cốc tăng cân"]],
  ["Thực phẩm khô & Đồ hộp", ["Mì ăn liền", "Thịt hộp", "Gia vị", "Phô mai"]],
  ["Hóa phẩm gia dụng", ["Viên giặt quần áo"]],
];

const descriptions: Record<string, string> = {
  "Giỏ quà trái cây": "Giỏ trái cây nhập khẩu bọc lưới, thắt nơ, hợp để biếu tặng và thăm hỏi.",
  "Hộp quà trái cây": "Hộp và khay trái cây sắp sẵn, gọn gàng, nhiều mức giá.",
  "Kẹo ngậm": "Gồm kẹo Ricola, kẹo sâm.",
  "Trái cây sấy": "Gồm nho khô.",
};

// Giữ nguyên mã của hai danh mục cũ để sản phẩm đã đăng không bị lạc.
const fixedIds: Record<string, string> = { "Giỏ quà trái cây": "c-gio", "Hộp quà trái cây": "c-hop" };

const categories: Category[] = groups.flatMap(([name, children, image]) => {
  const slug = slugify(name);
  const parent: Category = { id: `c-${slug}`, slug, name, description: "", parentId: null, image: image ?? "" };
  return [
    parent,
    ...children.map((child) => {
      const childSlug = slugify(child);
      return {
        id: fixedIds[child] ?? `c-${childSlug}`,
        slug: childSlug,
        name: child,
        description: descriptions[child] ?? "",
        parentId: parent.id,
        image: "",
      };
    }),
  ];
});

type Row = [slug: string, name: string, cat: string, priceMin: number, priceLabel: string, description: string, featured?: boolean];

const rows: Row[] = [
  ["gio-luoi-xanh-duong", "Giỏ quà lưới xanh dương", "c-gio", 1000000, "1.000.000 – 1.200.000đ", "Dưa lưới, nho xanh, cherry, lê, táo và kiwi, xếp trong giỏ bọc lưới xanh dương, thắt nơ trắng.", true],
  ["gio-luoi-hong-cherry", "Giỏ quà lưới hồng", "c-gio", 1000000, "1.000.000 – 1.200.000đ", "Dưa lưới, nho xanh, cherry, lê, dưa vàng và kiwi trong giỏ bọc lưới hồng.", true],
  ["gio-hoa-hong-phan", "Giỏ hoa và trái cây hồng phấn", "c-gio", 1000000, "1.000.000đ", "Nho xanh, việt quất, cam, lê, kiwi xếp cùng hoa, giỏ bọc lưới hồng phấn.", true],
  ["gio-hoa-baby-hong", "Giỏ hoa baby và trái cây", "c-gio", 1000000, "1.000.000đ", "Nho xanh, cam, kiwi và trái cây theo mùa, viền hoa baby trắng và hoa hồng, thắt nơ hồng."],
  ["gio-luoi-kem-no-do", "Giỏ quà lưới kem nơ đỏ", "c-gio", 1000000, "1.000.000đ", "Nho xanh, lê, cam, kiwi và táo trong giỏ bọc lưới màu kem, thắt nơ đỏ."],
  ["gio-luoi-hong-dua-luoi", "Giỏ quà dưa lưới lưới hồng", "c-gio", 900000, "900.000 – 1.000.000đ", "Dưa lưới, nho xanh, lê, kiwi và cam trong giỏ bọc lưới hồng, thắt nơ."],
  ["gio-luoi-vang", "Giỏ quà lưới vàng", "c-gio", 800000, "800.000 – 900.000đ", "Dưa lưới, nho xanh, cam, táo, lê và kiwi trong giỏ bọc lưới vàng.", true],
  ["gio-hoa-luoi-xanh", "Giỏ hoa và trái cây lưới xanh", "c-gio", 700000, "7xx.000đ", "Nho xanh, cam, kiwi, táo xếp cùng hoa, giỏ bọc lưới xanh lá."],
  ["khay-hoa-tiet-cherry-viet-quat", "Khay quà cherry và việt quất", "c-hop", 700000, "7xx.000đ", "Việt quất, cam, cherry, nho đen, táo và lê trong khay giấy họa tiết hoa.", true],
  ["hop-chu-nhat-do", "Hộp quà chữ nhật đỏ", "c-hop", 600000, "6xx.000đ", "Xoài, cam, táo, nho đen và lê trong hộp đỏ viền vàng.", true],
  ["khay-hoa-tiet-sau-vi", "Khay quà họa tiết hoa", "c-hop", 600000, "6xx.000đ", "Cam, việt quất, xoài, nho xanh, táo và lê trong khay giấy họa tiết hoa."],
  ["hop-tron-hong-cherry", "Hộp tròn hồng cherry và nho xanh", "c-hop", 500000, "5xx.000đ", "Nho xanh, cherry, táo, lê và cam trong hộp tròn màu hồng.", true],
  ["hop-mica-dua-luoi-cherry", "Hộp trong suốt dưa lưới và cherry", "c-hop", 1000000, "1.000.000đ", "Dưa lưới, cherry, nho xanh, táo và lê trong hộp trong suốt."],
  ["hop-cam-nam-vi", "Hộp quà cam", "c-hop", 400000, "4xx.000đ", "Táo, nho xanh, lê, cam và dưa vàng trong hộp màu cam."],
  ["hop-tron-hong-tao-le", "Hộp tròn hồng táo và lê", "c-hop", 400000, "4xx.000đ", "Táo, nho xanh, lê và cam trong hộp tròn màu hồng."],
  ["hop-trai-tim-xanh-la", "Hộp trái tim xanh lá", "c-hop", 300000, "3xx.000đ", "Lê, táo và nho xanh trong hộp trái tim màu xanh lá đậm.", true],
  ["hop-trai-tim-xanh-duong", "Hộp trái tim xanh dương", "c-hop", 300000, "3xx.000đ", "Táo, cam và nho xanh trong hộp trái tim màu xanh dương."],
  ["hop-trai-tim-hong", "Hộp trái tim hồng", "c-hop", 300000, "3xx.000đ", "Cam, kiwi và nho đen trong hộp trái tim màu hồng."],
  ["hop-hoa-va-trai-cay", "Hộp hoa và trái cây", "c-hop", 300000, "3xx.000đ", "Cam, kiwi và cherry xếp cùng hoa trong hộp trắng nắp trong."],
  ["hop-hong-nho-xanh", "Hộp hồng nho xanh", "c-hop", 300000, "3xx.000đ", "Nho xanh, táo, cam và lê trong hộp màu hồng."],
  ["hop-hong-chin-trai-cam", "Hộp hồng chín trái cam", "c-hop", 300000, "3xx.000đ", "Chín trái cam xếp trong hộp hồng, thắt nơ."],
  ["khay-nho-xanh", "Khay nho xanh", "c-hop", 300000, "3xx.000đ", "Nho xanh xếp đầy khay giấy kraft."],
  ["hop-dau-tay-no-hong", "Hộp dâu tây nơ hồng", "c-hop", 200000, "2xx.000đ", "Dâu tây và nho xanh trong hộp trong suốt, thắt nơ hồng.", true],
  ["hop-vuong-trang", "Hộp vuông trắng", "c-hop", 200000, "2xx.000đ", "Cam, kiwi và nho đen trong hộp vuông màu trắng."],
  ["hop-kraft-tao-nho", "Hộp kraft táo và nho xanh", "c-hop", 200000, "2xx.000đ", "Táo và nho xanh trong hộp giấy kraft nắp trong."],
  ["hop-trang-tao-nho-cam", "Hộp trắng táo, nho xanh, cam", "c-hop", 200000, "2xx.000đ", "Táo, nho xanh và cam trong hộp màu trắng."],
  ["hop-trang-tao-xanh", "Hộp trắng táo xanh", "c-hop", 200000, "2xx.000đ", "Táo xanh, cam và táo đỏ trong hộp màu trắng."],
];

const BASE = Date.UTC(2026, 9, 10);

const products: Product[] = rows.map(([slug, name, categoryId, priceMin, priceLabel, description, featured], i) => ({
  id: `p-${slug}`,
  slug,
  name,
  categoryId,
  priceMin,
  priceLabel,
  description,
  images: [`/products/${slug}.webp`],
  featured: Boolean(featured),
  visible: true,
  createdAt: new Date(BASE - i * 60_000).toISOString(),
}));

export const defaultContent: Content = {
  shop: {
    name: "HT Food",
    tagline: "Trái cây · Bánh kẹo nhập khẩu Xuân Lộc",
    address: "136 Hùng Vương, TT. Gia Ray, Xuân Lộc, Đồng Nai",
    phone: "093 794 70 27",
    zalo: "https://zalo.me/0937947027",
    facebook: "",
    messenger: "",
    hours: "",
  },
  announcement: "",
  hero: {
    eyebrow: "Trái cây · Bánh kẹo nhập khẩu tại Xuân Lộc",
    title: "Món quà tươi ngon, gói ghém chỉn chu.",
    subtitle:
      "HT Food chọn trái cây nhập khẩu và bánh kẹo ngoại, sắp thành giỏ quà, hộp quà theo đúng ngân sách của bạn. Đặt qua Zalo, nhận tại 136 Hùng Vương, Gia Ray.",
    image: "/hero/nen-trai-cay.webp",
    imageSmall: "/products/hop-trai-tim-xanh-la.webp",
  },
  about: {
    title: "Cửa hàng nhỏ ở Gia Ray, làm quà bằng sự chăm chút.",
    body: "HT Food là cửa hàng trái cây và bánh kẹo nhập khẩu tại thị trấn Gia Ray, Xuân Lộc. Mỗi giỏ, mỗi hộp đều được sắp bằng tay và điểm hoa lá trang trí, để món quà trao đi trông đẹp như ý người tặng.",
  },
  steps: [
    {
      title: "Chọn mẫu",
      body: "Xem các mẫu giỏ và hộp quà theo mức giá, hoặc gửi cho HT Food mẫu bạn thích.",
    },
    {
      title: "Nhắn Zalo hoặc gọi",
      body: "Cho cửa hàng biết ngân sách, dịp tặng và ngày cần nhận. HT Food báo giá cụ thể theo trái cây đang có.",
    },
    {
      title: "Nhận quà",
      body: "Ghé 136 Hùng Vương, Gia Ray để nhận, hoặc trao đổi với cửa hàng về việc giao hàng.",
    },
  ],
  candy: {
    title: "Bánh kẹo nhập khẩu",
    body: "Sản phẩm của danh mục này đang được cập nhật lên website. Nhắn Zalo để HT Food gửi hình các loại đang có tại cửa hàng.",
  },
  box: {
    title: "Tự chọn hộp quà theo ý bạn.",
    intro:
      "Chọn kiểu hộp, mức ngân sách và những loại bạn muốn có. HT Food sẽ báo lại loại đang có và giá cụ thể qua Zalo.",
    styles: ["Hộp chữ nhật", "Hộp vuông", "Hộp tròn", "Hộp trái tim", "Khay giấy", "Giỏ bọc lưới", "Giỏ kèm hoa"],
    items: ["Nho xanh", "Nho đen", "Táo", "Cam", "Lê", "Kiwi", "Dưa lưới", "Dưa vàng", "Cherry", "Việt quất", "Dâu tây", "Xoài", "Bánh kẹo nhập khẩu"],
  },
  productNote:
    "Trái cây trong giỏ, hộp có thể thay đổi theo mùa và theo hàng về. Nhắn HT Food để chọn loại trái cây theo ý bạn.",
};

export const seed: Db = { categories, products, content: defaultContent };
