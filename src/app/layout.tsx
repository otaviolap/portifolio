import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Placeholder de tipografia: Geist e self-hosted pelo next/font em build-time
// (sem request a Google em runtime). Trocar por next/font/local quando as
// fontes definitivas do projeto existirem em public/fonts (ver doc 02).
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Portfólio",
    template: "%s · Portfólio",
  },
  description:
    "Portfólio de projetos — desenvolvimento web sob medida. (placeholder da Fase 0)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
