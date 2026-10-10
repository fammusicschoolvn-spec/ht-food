import { LeafIcon } from "./icons";

/** Tiêu đề mục căn giữa, có nét gạch và chiếc lá bên dưới. */
export function SectionTitle({
  eyebrow,
  title,
  tone = "light",
}: {
  eyebrow?: string;
  title: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && <p className={`eyebrow ${dark ? "text-gold" : "text-gold-deep"}`}>{eyebrow}</p>}
      <h2 className="mt-3 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-bold uppercase leading-[1.2] tracking-[0.01em] text-balance">
        {title}
      </h2>
      <div aria-hidden className={`mt-4 flex items-center justify-center gap-3 ${dark ? "text-gold" : "text-forest-600"}`}>
        <span className="h-px w-12 bg-current opacity-60" />
        <LeafIcon width={16} height={16} />
        <span className="h-px w-12 bg-current opacity-60" />
      </div>
    </div>
  );
}
