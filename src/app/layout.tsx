import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "OpenClaw Helicarrier",
  description: "Agent Swarm Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-gray-950 text-gray-200">
      <body className={`${inter.variable} ${mono.variable} font-sans h-full overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
