import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "رزيم العقارية — Razeem Real Estate",
  description:
    "منصة رزيم العقارية — أفضل العقارات في المملكة العربية السعودية",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return children;
}
