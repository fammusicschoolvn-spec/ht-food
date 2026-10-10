import type { FruitKind } from "@/lib/builder";

// Trái cây vẽ bằng SVG, tô chuyển màu để có khối. Mỗi hình có tâm ở (0,0), bán kính khoảng 26.

const G = (id: string, stops: [string, string, string], cx = "35%", cy = "30%") => (
  <radialGradient id={id} cx={cx} cy={cy} r="75%">
    <stop offset="0%" stopColor={stops[0]} />
    <stop offset="55%" stopColor={stops[1]} />
    <stop offset="100%" stopColor={stops[2]} />
  </radialGradient>
);

/** Đặt một lần trong trang; mọi hình trái cây dùng chung các màu chuyển này. */
export function FruitDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
      <defs>
        {G("fa-red", ["#ff8a7a", "#d92b2b", "#8e1218"])}
        {G("fa-orange", ["#ffd27a", "#ff9a1f", "#d96a00"])}
        {G("fa-pear", ["#f6f0a8", "#d9cf5a", "#9aa02e"])}
        {G("fa-kiwi", ["#b8946a", "#8a6a45", "#5c4328"])}
        {G("fa-mango", ["#ffe37a", "#ffb52e", "#e2562a"])}
        {G("fa-melon", ["#eef0c8", "#c9d19a", "#93a26a"])}
        {G("fa-melon-y", ["#fff3a0", "#ffd83d", "#e0a800"])}
        {G("fa-grape-g", ["#eaf7a8", "#a9d14a", "#6b9a1f"])}
        {G("fa-grape-p", ["#b79ad6", "#6a3d9a", "#3a1d5c"])}
        {G("fa-cherry", ["#ff6a7a", "#b3122b", "#5e0716"])}
        {G("fa-straw", ["#ff8f7a", "#e8322e", "#a81420"])}
        {G("fa-blue", ["#8fa3d9", "#3b4f94", "#1d2752"])}
        {G("fa-gift", ["#f6e3a6", "#c5a253", "#8a6a1f"])}
        <linearGradient id="fa-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6fbf4a" />
          <stop offset="100%" stopColor="#1f7a3a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const Shine = ({ x = -9, y = -11, rx = 7, ry = 4.5 }: { x?: number; y?: number; rx?: number; ry?: number }) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#fff" opacity="0.38" transform={`rotate(-28 ${x} ${y})`} />
);

const Leaf = ({ t }: { t: string }) => <path d="M0 0C6-9 16-9 20-3C13 3 5 3 0 0Z" fill="url(#fa-leaf)" transform={t} />;

const Stem = ({ d }: { d: string }) => <path d={d} fill="none" stroke="#6b4a26" strokeWidth="2.6" strokeLinecap="round" />;

function Bunch({ fill }: { fill: string }) {
  const rows = [
    [-18, -6, 6, 18],
    [-12, 0, 12],
    [-6, 6],
    [0],
  ];
  return (
    <>
      <Stem d="M0-27V-18" />
      <Leaf t="translate(1 -24) rotate(-12)" />
      {rows.flatMap((xs, r) =>
        xs.map((x) => (
          <g key={`${r}${x}`}>
            <circle cx={x} cy={-12 + r * 11} r="8.6" fill={fill} stroke="rgb(0 0 0 / 0.12)" strokeWidth="0.6" />
            <circle cx={x - 2.6} cy={-15 + r * 11} r="2.1" fill="#fff" opacity="0.45" />
          </g>
        )),
      )}
    </>
  );
}

export function FruitArt({ kind }: { kind: FruitKind }) {
  switch (kind) {
    case "apple":
      return (
        <>
          <path d="M0-19C-14-27-28-16-27 1C-26 18-13 27 0 22C13 27 26 18 27 1C28-16 14-27 0-19Z" fill="url(#fa-red)" />
          <Stem d="M0-19C0-25 3-29 6-30" />
          <Leaf t="translate(3 -24) rotate(-18)" />
          <Shine x={-12} y={-8} />
        </>
      );
    case "orange":
      return (
        <>
          <circle r="25" fill="url(#fa-orange)" />
          <path d="M0-24l2 3 3-1-2 3 2 3-3-1-2 3-2-3-3 1 2-3-2-3 3 1Z" fill="#3f8a2e" />
          <Shine />
        </>
      );
    case "pear":
      return (
        <>
          <path d="M0-26C-9-26-10-15-13-7C-17 2-25 6-24 16C-23 26-11 29 0 29C11 29 23 26 24 16C25 6 17 2 13-7C10-15 9-26 0-26Z" fill="url(#fa-pear)" />
          <Stem d="M0-26C0-31 2-34 5-35" />
          <Shine x={-9} y={6} rx={6} ry={9} />
        </>
      );
    case "kiwi":
      return (
        <>
          <ellipse rx="25" ry="20" fill="url(#fa-kiwi)" />
          <ellipse rx="25" ry="20" fill="none" stroke="#4a341c" strokeWidth="0.8" strokeDasharray="1 3" opacity="0.5" />
          <Shine x={-10} y={-8} rx={8} ry={4} />
        </>
      );
    case "mango":
      return (
        <>
          <path d="M-22 8C-28-8-12-26 6-24C22-22 30-8 24 8C18 22-2 28-14 22C-18 20-20 14-22 8Z" fill="url(#fa-mango)" />
          <Stem d="M4-24C5-28 7-30 10-31" />
          <Shine x={-6} y={-10} rx={9} ry={5} />
        </>
      );
    case "melon":
    case "melonYellow":
      return (
        <>
          <circle r="27" fill={kind === "melon" ? "url(#fa-melon)" : "url(#fa-melon-y)"} />
          <g fill="none" stroke={kind === "melon" ? "#f4f6dc" : "#fff7c2"} strokeWidth="1" opacity="0.75">
            <path d="M-27 0C-14-8 14-8 27 0M-25-10C-12-17 12-17 25-10M-25 10C-12 3 12 3 25 10M-19 19C-9 14 9 14 19 19" />
            <path d="M0-27C-8-14-8 14 0 27M-11-25C-18-12-18 12-11 25M11-25C18-12 18 12 11 25" />
          </g>
          <Stem d="M-6-30H6M0-30V-25" />
          <Shine x={-11} y={-12} rx={8} ry={5} />
        </>
      );
    case "grapeGreen":
      return <Bunch fill="url(#fa-grape-g)" />;
    case "grapePurple":
      return <Bunch fill="url(#fa-grape-p)" />;
    case "cherry":
      return (
        <>
          <path d="M-11 6C-8-10 0-20 6-28M12 8C10-8 8-18 6-28" fill="none" stroke="#5c7a2a" strokeWidth="2.2" strokeLinecap="round" />
          <Leaf t="translate(6 -27) rotate(8)" />
          <circle cx="-11" cy="12" r="13" fill="url(#fa-cherry)" />
          <circle cx="13" cy="14" r="13" fill="url(#fa-cherry)" />
          <Shine x={-15} y={7} rx={4} ry={2.6} />
          <Shine x={9} y={9} rx={4} ry={2.6} />
        </>
      );
    case "strawberry":
      return (
        <>
          <path d="M0 27C-14 18-24 4-22-8C-20-18-10-20 0-16C10-20 20-18 22-8C24 4 14 18 0 27Z" fill="url(#fa-straw)" />
          <g fill="#ffe9a8">
            {[[-10, -4], [0, -2], [10, -4], [-6, 6], [6, 6], [0, 14], [-13, 4], [13, 4]].map(([x, y]) => (
              <ellipse key={`${x}${y}`} cx={x} cy={y} rx="1.1" ry="1.7" />
            ))}
          </g>
          <path d="M0-14L-13-22-6-13-18-13-8-8 0-9 8-8 18-13 6-13 13-22Z" fill="url(#fa-leaf)" />
        </>
      );
    case "blueberry":
      return (
        <>
          {[[-12, 6], [12, 6], [0, -10], [0, 12], [-13, -8], [13, -8]].map(([x, y]) => (
            <g key={`${x}${y}`}>
              <circle cx={x} cy={y} r="11" fill="url(#fa-blue)" />
              <circle cx={x} cy={y - 1} r="2.6" fill="#141b3a" opacity="0.7" />
              <circle cx={x - 4} cy={y - 5} r="2" fill="#fff" opacity="0.35" />
            </g>
          ))}
        </>
      );
    default:
      return (
        <>
          <rect x="-22" y="-18" width="44" height="38" rx="5" fill="url(#fa-gift)" />
          <rect x="-4" y="-18" width="8" height="38" fill="#0b3d17" opacity="0.85" />
          <rect x="-22" y="-4" width="44" height="8" fill="#0b3d17" opacity="0.85" />
          <path d="M0-18C-10-30-18-22-10-18ZM0-18C10-30 18-22 10-18Z" fill="#0b3d17" />
        </>
      );
  }
}

/** Biểu tượng nhỏ dùng trong danh sách chọn. */
export function FruitIcon({ kind, size = 48 }: { kind: FruitKind; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-34 -38 68 72" aria-hidden focusable="false">
      <FruitArt kind={kind} />
    </svg>
  );
}
