import { LeafIcon } from "./icons";

/** Nhãn giá xanh viền vàng có chiếc lá, theo đúng nhãn trên ảnh sản phẩm của cửa hàng. */
export function PriceTag({ children, size = "md" }: { children: React.ReactNode; size?: "md" | "lg" }) {
  return (
    <span
      className={`relative inline-flex items-center rounded-full border border-gold bg-forest-900 font-display font-medium text-gold-soft shadow-[inset_0_0_0_3px_var(--color-forest-900),inset_0_0_0_4px_rgb(197_162_83/0.35)] ${
        size === "lg" ? "px-7 py-3 text-[1.7rem]" : "px-5 py-2 text-[1.15rem]"
      }`}
    >
      {children}
      <LeafIcon className="absolute -right-1.5 -top-2.5 text-forest-500" width={size === "lg" ? 24 : 18} height={size === "lg" ? 24 : 18} />
    </span>
  );
}
