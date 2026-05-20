import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sicily & Malta Trip Guide",
  description: "A personal trip guide app for the Sicily and Malta journey."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
