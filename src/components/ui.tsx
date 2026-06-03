"use client";

import type { ReactNode } from "react";

export const inp =
  "w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export function Campo({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export function ErrBox({ texto }: { texto: string }) {
  return (
    <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
      {texto}
    </div>
  );
}

export function Vacio({ texto }: { texto: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
      {texto}
    </div>
  );
}

export function Acciones({
  pending,
  onClose,
  label = "Guardar",
}: {
  pending: boolean;
  onClose: () => void;
  label?: string;
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
      <button
        type="button"
        onClick={onClose}
        className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Guardando…" : label}
      </button>
    </div>
  );
}

export function Modal({
  titulo,
  onClose,
  children,
  wide,
}: {
  titulo: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-lg bg-white p-5 shadow-xl ${
          wide ? "max-w-3xl" : "max-w-lg"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 border-b border-slate-200 pb-2 text-lg font-bold text-slate-900">
          {titulo}
        </h2>
        {children}
      </div>
    </div>
  );
}

const BADGE_COLORS: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-800",
  blue: "bg-blue-100 text-blue-800",
  amber: "bg-amber-100 text-amber-800",
  rose: "bg-rose-100 text-rose-800",
  gray: "bg-slate-100 text-slate-700",
  violet: "bg-violet-100 text-violet-800",
};

export function Badge({ label, color = "gray" }: { label: string; color?: string }) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        BADGE_COLORS[color] ?? BADGE_COLORS.gray
      }`}
    >
      {label}
    </span>
  );
}
