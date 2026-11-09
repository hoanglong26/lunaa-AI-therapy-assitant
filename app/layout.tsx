import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lunaa — Không gian tham vấn & lắng nghe tâm lý",
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
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
