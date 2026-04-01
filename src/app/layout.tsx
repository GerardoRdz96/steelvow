import type { Metadata, Viewport } from "next";
import { I18nProvider } from "@/lib/i18n/context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Steelvow — OSHA Compliance for Construction",
  description:
    "AI-powered safety compliance platform for construction crews. Daily inspections, incident reports, and OSHA documentation — offline-first.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Steelvow",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ea580c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-slate-50 text-slate-700 antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
