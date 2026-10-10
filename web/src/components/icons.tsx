import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = (props: P) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

export const PhoneIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 4h3l1.5 4.5-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2L20 16v3a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z" />
  </svg>
);

export const ChatIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5v-9Z" />
    <path d="M8.5 9h7M8.5 12h4.5" />
  </svg>
);

export const PinIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.500C5 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

export const ClockIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const ArrowIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const MenuIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const SearchIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.500 4.500" />
  </svg>
);

export const BoxIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 11h16v8.500a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11ZM3 7.500h18V11H3zM12 7.500v13" />
    <path d="M12 7.500C10.500 4 7 3.500 7 5.700c0 1.800 3 1.800 5 1.800Zm0 0C13.500 4 17 3.500 17 5.700c0 1.800-3 1.800-5 1.800Z" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 12.500 4.500 4.500L19 7.500" />
  </svg>
);

export const FacebookIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 8.5V7a1.5 1.5 0 0 1 1.5-1.5H17V3h-2.500A4 4 0 0 0 10.500 7v1.500H8V11h2.500v10H14V11h2.500l.5-2.500H14Z" />
  </svg>
);

/** Chiếc lá trong logo HT Food. */
export const LeafIcon = (p: P) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" aria-hidden {...p}>
    <path d="M3 21C3 10.5 10.5 3 21 3c0 10.5-7.500 18-18 18Zm2.600-2.600c5.200-.9 9.300-4.600 11.700-9.700-3.800 2-8.700 5.300-11.700 9.700Z" />
  </svg>
);
