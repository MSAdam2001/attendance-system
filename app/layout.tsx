import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google"; // COMMENT THIS OUT
import "./globals.css";

export const metadata: Metadata = {
  title: "Attendance System",
  description: "Smart Attendance Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}