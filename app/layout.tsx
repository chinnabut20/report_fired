import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FireD - ระบบกรองข้อมูลคำร้องขอจัดการเชื้อเพลิง",
  description: "ระบบกรองข้อมูลคำร้องขอจัดการเชื้อเพลิง",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="font-prompt antialiased">{children}</body>
    </html>
  );
}
