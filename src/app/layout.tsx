import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventario · Empresa Demo",
  description: "Gestión de inventario, EPP, activos y asignaciones para empresas de seguridad.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
