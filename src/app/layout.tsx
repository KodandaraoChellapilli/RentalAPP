import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const display = DM_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "West Ridge Rentals",
  description: "Equipment rental operations for employees, owners, and customers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} antialiased`}>{children}</body>
    </html>
  );
}
