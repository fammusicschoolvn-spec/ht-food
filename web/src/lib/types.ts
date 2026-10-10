export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Nhóm lớn chứa danh mục này; null nếu chính nó là nhóm lớn. */
  parentId?: string | null;
  /** Ảnh đại diện (ô tròn ở trang chủ). */
  image?: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  /** Giá thấp nhất (đồng), dùng để lọc và sắp xếp. */
  priceMin: number;
  /** Giá hiển thị cho khách, ví dụ "3xx.000đ" hoặc "800.000 – 900.000đ". */
  priceLabel: string;
  description: string;
  /** Ảnh đầu tiên là ảnh chính. */
  images: string[];
  featured: boolean;
  visible: boolean;
  createdAt: string;
};

export type Step = { title: string; body: string };

export type Content = {
  shop: {
    name: string;
    tagline: string;
    address: string;
    phone: string;
    zalo: string;
    facebook: string;
    messenger: string;
    hours: string;
  };
  announcement: string;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    image: string;
    imageSmall: string;
  };
  about: { title: string; body: string };
  steps: Step[];
  candy: { title: string; body: string };
  productNote: string;
  box: { title: string; intro: string; styles: string[]; items: string[] };
};

export type Db = {
  categories: Category[];
  products: Product[];
  content: Content;
};
