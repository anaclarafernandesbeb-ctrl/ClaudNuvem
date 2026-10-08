import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prospecta · Copiloto de Prospecção",
  description:
    "Todo dia, 10 empresas certas para você vender, com a mensagem pronta para enviar em um clique.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400..700&family=Space+Grotesk:wght@500..700&display=swap"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
