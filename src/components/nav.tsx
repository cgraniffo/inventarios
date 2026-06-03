"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Radio,
  ClipboardList,
  Users,
  MapPin,
  ArrowLeftRight,
  Bell,
  BookOpen,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

const LINKS = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/articulos", label: "Artículos / EPP", icon: Package },
  { href: "/activos", label: "Activos serializados", icon: Radio },
  { href: "/asignaciones", label: "Asignaciones", icon: ClipboardList },
  { href: "/movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/personal", label: "Personal", icon: Users },
  { href: "/ubicaciones", label: "Ubicaciones", icon: MapPin },
  { href: "/alertas", label: "Alertas", icon: Bell },
  { href: "/asistente", label: "Asistente IA", icon: Sparkles },
  { href: "/manual", label: "Manual de Usuario", icon: BookOpen },
];

export function Nav({ email }: { email?: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-4">
        <ShieldCheck className="h-6 w-6 text-emerald-600" />
        <div>
          <p className="text-sm font-bold leading-tight text-slate-900">Inventario</p>
          <p className="text-[11px] leading-tight text-slate-500">Empresa Demo · Seguridad</p>
        </div>
      </div>
      <nav className="flex-1 p-2">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`mb-0.5 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium ${
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 px-4 py-3">
        {email && (
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-[11px] text-slate-500" title={email}>
              {email}
            </span>
            <LogoutButton />
          </div>
        )}
        <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
          Desarrollado por
          <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-emerald-600 text-[10px] font-bold leading-none text-white">b</span>
          <span className="font-semibold text-slate-500">BData</span>
        </p>
      </div>
    </aside>
  );
}

/** Barra superior móvil (scroll horizontal de secciones + logout). */
export function NavMobile({ email }: { email?: string }) {
  const pathname = usePathname();
  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-bold text-slate-900">Empresa Demo</span>
        </div>
        {email && <LogoutButton />}
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                active ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
