import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SRGC Result Management System",
  description: "Official Examination and Result Management System for Shri Ram Group of Colleges",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
