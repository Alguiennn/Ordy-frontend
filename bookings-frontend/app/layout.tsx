import "./globals.css";
import type { Metadata } from "next";
import ThemeToggle from "./(admin)/themeToggle";

export const metadata: Metadata = {
  title: "Panel de Administración de Ordy",
  description: "Base inicial del proyecto de gestión de reservas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}