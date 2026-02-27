import type { Metadata } from "next";
import "@/styles/globals.css";
import { Providers } from "@/lib/providers";

export const metadata: Metadata = {
  title: "Helicarrier v3 - Mission Control",
  description: "Real-time mission control dashboard for OpenClaw agent operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-bg-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
