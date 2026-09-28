import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LOSI ESCALA | Gestão operacional para parques",
  description: "Organize freelancers, escalas, grupos e programações do seu parque em um único sistema.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
