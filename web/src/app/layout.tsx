import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Manrope } from "next/font/google";
import "./globals.css";

const heading = Be_Vietnam_Pro({
  variable: "--font-heading",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.htfoodxuanloc.com"),
  title: {
    default: "HT Food – Trái cây, bánh kẹo nhập khẩu Xuân Lộc",
    template: "%s | HT Food",
  },
  description:
    "HT Food: giỏ quà, hộp quà trái cây nhập khẩu và bánh kẹo ngoại tại 136 Hùng Vương, TT. Gia Ray, Xuân Lộc, Đồng Nai. Đặt qua Zalo 093 794 70 27.",
};

export const viewport: Viewport = {
  themeColor: "#072f0f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${heading.variable} ${manrope.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
