import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2026 희망열기 캠페인 | 물품 배분 현황 대시보드",
  description: "경상남도 노인맞춤돌봄서비스 희망열기 캠페인 물품 수령 현황을 실시간으로 모니터링하는 관리자 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
