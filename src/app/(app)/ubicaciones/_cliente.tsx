"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Ubicacion } from "@/lib/types";
import { TIPOS_UBICACION, labelDe } from "@/lib/constants";
import { Modal, Campo, ErrBox, Vacio, Badge, inp } from "@/components/ui";
import { guardarUbicacionAction, eliminarUbicacionAction } from "./_actions";

export function UbicacionesCliente({ ubicaciones }: { ubicaciones: Ubicacion[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<null | { u?: Ubicacion }>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");

  const filt = ubicaciones.filter((u) =>
    `${u.nombre} ${u.responsable ?? ""} ${u.direccion ?? ""}`.toLowerCase().includes(q.toLowerCase()),
  );

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    start(async () => {
      const r = await fn();
      if (r.ok) {
        setModal(null);
        router.refresh();
      } else setError(r.error ?? "No se pudo guardar.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar ubicación…"
          className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={() => setModal({})}
          className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          + Nueva ubicación
        </button>
      </div>

      {error && !modal && <ErrBox texto={error} />}

      {filt.length === 0 ? (
        <Vacio texto="Sin ubicaciones. Crea la primera (ej. Bodega Central)." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Responsable</th>
                <th className="px-3 py-2">Dirección</th>
                <th className="px-3 py-2">Teléfono</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filt.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-900">{u.nombre}</td>
                  <td className="px-3 py-2">
                    <Badge label={labelDe(TIPOS_UBICACION, u.tipo)} color="blue" />
                  </td>
                  <td className="px-3 py-2 text-slate-600">{u.responsable ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-600">{u.direccion ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-600">{u.telefono ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setModal({ u })}
                      className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal titulo={modal.u ? "Editar ubicación" : "Nueva ubicación"} onClose={() => setModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run(() =>
                guardarUbicacionAction({
                  id: modal.u?.id,
                  nombre: String(f.get("nombre") ?? ""),
                  tipo: String(f.get("tipo") ?? "bodega"),
                  direccion: String(f.get("direccion") ?? ""),
                  responsable: String(f.get("responsable") ?? ""),
                  telefono: String(f.get("telefono") ?? ""),
                  observacion: String(f.get("observacion") ?? ""),
                }),
              );
            }}
            className="space-y-3"
          >
            {error && <ErrBox texto={error} />}
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Nombre *" className="col-span-2">
                <input name="nombre" required defaultValue={modal.u?.nombre ?? ""} className={inp} />
              </Campo>
              <Campo label="Tipo *">
                <select name="tipo" defaultValue={modal.u?.tipo ?? "bodega"} className={inp}>
                  {TIPOS_UBICACION.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Responsable">
                <input name="responsable" defaultValue={modal.u?.responsable ?? ""} className={inp} />
              </Campo>
              <Campo label="Dirección" className="col-span-2">
                <input name="direccion" defaultValue={modal.u?.direccion ?? ""} className={inp} />
              </Campo>
              <Campo label="Teléfono">
                <input name="telefono" defaultValue={modal.u?.telefono ?? ""} className={inp} />
              </Campo>
              <Campo label="Observación" className="col-span-2">
                <textarea name="observacion" defaultValue={modal.u?.observacion ?? ""} className={inp} />
              </Campo>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              {modal.u ? (
                <button
                  type="button"
                  onClick={() => run(() => eliminarUbicacionAction(modal.u!.id))}
                  className="rounded border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50"
                >
                  Eliminar
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {pending ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
