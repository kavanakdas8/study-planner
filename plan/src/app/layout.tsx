import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Study Planner | Enterprise Obsidian SaaS",
  description:
    "Autonomous AI study curriculum planner and focus roadmap engine built for deep learning.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} dark h-full antialiased`}
    >
      <body className={`${inter.className} min-h-full bg-[#0a0a0c] text-slate-100 flex flex-col selection:bg-[#ea580c]/30 selection:text-orange-200`}>
        {children}
      </body>
    </html>
  );
}
