import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CuratePlan – Plan Smarter. Learn Better.",
  description:
    "Autonomous study curriculum planner and focus roadmap dashboard built for deep learning.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full light antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-[#f8fafc] text-[#0f172a] flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}
