import type { Metadata, Viewport } from "next";
import "./globals.css";
export const viewport: Viewport = {width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#f8f7f3'};

export const metadata: Metadata = {
  title: "Team Up — A little better, together",
  description: "A calm space to build daily habits, celebrate small wins, and grow with your people.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
