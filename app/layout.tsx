import type { Metadata, Viewport } from "next";
import { estedad } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "دستیار مالی",
  description:
    "دخل و خرجت را با متن، صدا یا عکس فاکتور ثبت کن و ببین این ماه چقدر برایت مانده.",
};

export const viewport: Viewport = {
  themeColor: "#f7f8f7",
  // Users zoom on transaction lists; blocking that would fail the AA bar.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={estedad.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
