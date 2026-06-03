"use client";

import { useState } from "react";
import { fCLP, fNum, fDate } from "@/lib/format";
import { Vacio, Badge } from "@/components/ui";

export type MovFull = {
  id: string;
  articulo: string;
  unidad: string;
  tipo: "entrada" | "salida" | "ajuste";
  cantidad: number;
  origen: string;
  fecha: string;
  valorTotal: number | null;
  observacion: string | null;
};

export function MovimientosCliente({ movimientos }: { movimientos: MovFull[] }) {
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");

  const filt = movimientos.filter((m) => {
    if (tipo && m.tipo !== tipo) return false;
    if (q && !m.articulo.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar artículo…"
          className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm" />
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="rounded border border-slate-300 px-2 py-1.5 text-sm">
          <option value="">Todos los tipos</option>
          <option value="entrada">Entradas</option>
          <option value="salida">Salidas</option>
          <option value="ajuste">Ajustes</option>
        </select>
      </div>

      {filt.length === 0 ? (
        <Vacio texto="Sin movimientos." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Artículo</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Origen</th>
                <th className="px-3 py-2 text-right">Cantidad</th>
                <th className="px-3 py-2 text-right">Valor</th>
                <th className="px-3 py-2">Obs.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filt.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-xs text-slate-600">{fDate(m.fecha)}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">{m.articulo}</td>
                  <td className="px-3 py-2">
                    <Badge label={m.tipo} color={m.tipo === "entrada" ? "emerald" : m.tipo === "salida" ? "rose" : "blue"} />
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">{m.origen}</td>
                  <td className={`px-3 py-2 text-right font-semibold tabular-nums ${m.cantidad >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {m.cantidad >= 0 ? "+" : ""}{fNum(m.cantidad)} <span className="text-xs text-slate-400">{m.unidad}</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-500">{m.valorTotal != null ? fCLP(m.valorTotal) : "—"}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{m.observacion ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
