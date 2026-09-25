import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arton · Konakta Bir Gün",
  description: "Kadın karakterle taş konağı, bahçeyi, kemerli revakı ve terasları keşfet.",
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
    <html lang="tr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
