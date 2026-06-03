"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Personal, Ubicacion } from "@/lib/types";
import { fDate } from "@/lib/format";
import { Modal, Campo, ErrBox, Vacio, inp } from "@/components/ui";
import { guardarPersonalAction, eliminarPersonalAction } from "./_actions";

export function PersonalCliente({
  personal,
  ubicaciones,
}: {
  personal: Personal[];
  ubicaciones: Pick<Ubicacion, "id" | "nombre">[];
}) {
  const router = useRouter();
  const [modal, setModal] = useState<null | { p?: Personal }>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");

  const ubiNombre = new Map(ubicaciones.map((u) => [u.id, u.nombre]));
  const filt = personal.filter((p) =>
    `${p.nombre} ${p.rut ?? ""} ${p.cargo ?? ""}`.toLowerCase().includes(q.toLowerCase()),
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
          placeholder="Buscar por nombre, RUT o cargo…"
          className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={() => setModal({})}
          className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          + Nuevo
        </button>
      </div>

      {error && !modal && <ErrBox texto={error} />}

      {filt.length === 0 ? (
        <Vacio texto="Sin personal cargado. Agrega a tus guardias y operativos." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">RUT</th>
                <th className="px-3 py-2">Cargo</th>
                <th className="px-3 py-2">Puesto / ubicación</th>
                <th className="px-3 py-2">Teléfono</th>
                <th className="px-3 py-2">Ingreso</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filt.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-900">{p.nombre}</td>
                  <td className="px-3 py-2 text-slate-600">{p.rut ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-600">{p.cargo ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {p.ubicacion_id ? ubiNombre.get(p.ubicacion_id) ?? "—" : "—"}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{p.telefono ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{fDate(p.fecha_ingreso)}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setModal({ p })}
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
        <Modal titulo={modal.p ? "Editar persona" : "Nueva persona"} onClose={() => setModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run(() =>
                guardarPersonalAction({
                  id: modal.p?.id,
                  nombre: String(f.get("nombre") ?? ""),
                  rut: String(f.get("rut") ?? ""),
                  cargo: String(f.get("cargo") ?? ""),
                  ubicacion_id: String(f.get("ubicacion_id") ?? "") || null,
                  telefono: String(f.get("telefono") ?? ""),
                  email: String(f.get("email") ?? ""),
                  fecha_ingreso: String(f.get("fecha_ingreso") ?? "") || null,
                  observacion: String(f.get("observacion") ?? ""),
                }),
              );
            }}
            className="space-y-3"
          >
            {error && <ErrBox texto={error} />}
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Nombre *" className="col-span-2">
                <input name="nombre" required defaultValue={modal.p?.nombre ?? ""} className={inp} />
              </Campo>
              <Campo label="RUT">
                <input name="rut" defaultValue={modal.p?.rut ?? ""} className={inp} placeholder="12.345.678-9" />
              </Campo>
              <Campo label="Cargo">
                <input name="cargo" defaultValue={modal.p?.cargo ?? ""} className={inp} placeholder="Guardia" />
              </Campo>
              <Campo label="Puesto / ubicación">
                <select name="ubicacion_id" defaultValue={modal.p?.ubicacion_id ?? ""} className={inp}>
                  <option value="">— Sin asignar —</option>
                  {ubicaciones.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Teléfono">
                <input name="telefono" defaultValue={modal.p?.telefono ?? ""} className={inp} />
              </Campo>
              <Campo label="Email">
                <input name="email" type="email" defaultValue={modal.p?.email ?? ""} className={inp} />
              </Campo>
              <Campo label="Fecha de ingreso">
                <input name="fecha_ingreso" type="date" defaultValue={modal.p?.fecha_ingreso?.slice(0, 10) ?? ""} className={inp} />
              </Campo>
              <Campo label="Observación" className="col-span-2">
                <textarea name="observacion" defaultValue={modal.p?.observacion ?? ""} className={inp} />
              </Campo>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              {modal.p ? (
                <button
                  type="button"
                  onClick={() => run(() => eliminarPersonalAction(modal.p!.id))}
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
