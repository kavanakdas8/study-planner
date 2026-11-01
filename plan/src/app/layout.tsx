import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CuratePlan | Enterprise Obsidian",
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
      className="dark h-full antialiased"
    >
      <body className="min-h-full bg-[#0a0a0c] text-slate-100 flex flex-col selection:bg-[#ea580c]/30 selection:text-orange-200">
        {children}
      </body>
    </html>
  );
}
