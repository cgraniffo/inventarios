import type { ReactNode } from "react";

/** Cabecera estándar de página: título, subtítulo y zona opcional de KPIs/acciones. */
export function PageHeader({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl p-4 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">{titulo}</h1>
        {subtitulo && <p className="mt-0.5 text-sm text-slate-500">{subtitulo}</p>}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </header>
  );
}
