import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "Lunaa - Người bạn đồng hành tâm lý",
  description:
    "Trò chuyện với Luna, chuyên gia tâm lý AI của bạn. Một không gian an toàn để chia sẻ, khám phá và chữa lành.",
  keywords: "tâm lý, ai, tư vấn, luna, sức khỏe tâm thần",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
