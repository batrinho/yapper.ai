import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { themeScript } from "@/lib/theme-script";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "yapper.ai", template: "%s · yapper.ai" },
  description: "An AI coach that helps you speak better: storytelling, public speaking and behavioral interviews.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="light" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
