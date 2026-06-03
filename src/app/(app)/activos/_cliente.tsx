"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Activo, Mantencion, Personal, Ubicacion } from "@/lib/types";
import { fCLP, fDate, hoyISO, diasHasta } from "@/lib/format";
import { CATEGORIAS_ACTIVO, ESTADOS_ACTIVO, TIPOS_MANTENCION, labelDe } from "@/lib/constants";
import { Modal, Campo, Acciones, ErrBox, Vacio, Badge, inp } from "@/components/ui";
import {
  guardarActivoAction,
  eliminarActivoAction,
  cambiarEstadoActivoAction,
  crearMantencionAction,
} from "./_actions";

const colorEstado = (estado: string) =>
  ESTADOS_ACTIVO.find((e) => e.value === estado)?.color ?? "gray";

type ModalT =
  | null
  | { kind: "activo"; act?: Activo }
  | { kind: "mantencion"; act: Activo };

export function ActivosCliente({
  activos,
  ubicaciones,
  personal,
  mantenciones,
}: {
  activos: Activo[];
  ubicaciones: Pick<Ubicacion, "id" | "nombre">[];
  personal: Pick<Personal, "id" | "nombre">[];
  mantenciones: Mantencion[];
}) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalT>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [est, setEst] = useState("");

  const ubiNombre = new Map(ubicaciones.map((u) => [u.id, u.nombre]));
  const perNombre = new Map(personal.map((p) => [p.id, p.nombre]));
  const mantPorActivo = useMemo(() => {
    const m = new Map<string, Mantencion[]>();
    for (const x of mantenciones) {
      const arr = m.get(x.activo_id) ?? [];
      arr.push(x);
      m.set(x.activo_id, arr);
    }
    return m;
  }, [mantenciones]);

  const filt = activos.filter((a) => {
    if (cat && a.categoria !== cat) return false;
    if (est && a.estado !== est) return false;
    if (q && !`${a.nombre} ${a.marca ?? ""} ${a.modelo ?? ""} ${a.numero_serie ?? ""}`.toLowerCase().includes(q.toLowerCase()))
      return false;
    return true;
  });

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
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, marca o N° serie…"
          className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded border border-slate-300 px-2 py-1.5 text-sm">
          <option value="">Todas las categorías</option>
          {CATEGORIAS_ACTIVO.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={est} onChange={(e) => setEst(e.target.value)} className="rounded border border-slate-300 px-2 py-1.5 text-sm">
          <option value="">Todos los estados</option>
          {ESTADOS_ACTIVO.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <button type="button" onClick={() => setModal({ kind: "activo" })}
          className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
          + Nuevo activo
        </button>
      </div>

      {error && !modal && <ErrBox texto={error} />}

      {filt.length === 0 ? (
        <Vacio texto="Sin activos serializados. Registra tus radios, equipos u otros bienes con N° de serie." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Activo</th>
                <th className="px-3 py-2">N° serie</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Ubicación / asignado</th>
                <th className="px-3 py-2">Cert./venc.</th>
                <th className="px-3 py-2 text-right">Valor</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filt.map((a) => {
                const dias = diasHasta(a.fecha_vencimiento);
                const mants = mantPorActivo.get(a.id) ?? [];
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-900">{a.nombre}</div>
                      <div className="text-xs text-slate-500">{[a.marca, a.modelo].filter(Boolean).join(" · ") || "—"}</div>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-700">{a.numero_serie ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-600">{labelDe(CATEGORIAS_ACTIVO, a.categoria)}</td>
                    <td className="px-3 py-2"><Badge label={labelDe(ESTADOS_ACTIVO, a.estado)} color={colorEstado(a.estado)} /></td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {a.asignado_a ? <>👤 {perNombre.get(a.asignado_a) ?? "—"}</> : a.ubicacion_id ? ubiNombre.get(a.ubicacion_id) ?? "—" : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {a.fecha_vencimiento ? (
                        <span className={dias != null && dias < 0 ? "font-semibold text-rose-700" : dias != null && dias <= 30 ? "font-semibold text-amber-700" : "text-slate-600"}>
                          {fDate(a.fecha_vencimiento)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600">{a.valor != null ? fCLP(a.valor) : "—"}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button type="button" onClick={() => setModal({ kind: "mantencion", act: a })}
                        title="Mantención" className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">
                        🔧{mants.length > 0 ? ` ${mants.length}` : ""}
                      </button>
                      <button type="button" onClick={() => setModal({ kind: "activo", act: a })}
                        className="ml-1 rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">✏️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL ACTIVO */}
      {modal?.kind === "activo" && (
        <Modal titulo={modal.act ? "Editar activo" : "Nuevo activo"} onClose={() => setModal(null)} wide>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run(() =>
                guardarActivoAction({
                  id: modal.act?.id,
                  nombre: String(f.get("nombre") ?? ""),
                  marca: String(f.get("marca") ?? ""),
                  modelo: String(f.get("modelo") ?? ""),
                  numero_serie: String(f.get("numero_serie") ?? ""),
                  categoria: String(f.get("categoria") ?? "comunicaciones"),
                  estado: String(f.get("estado") ?? "operativo"),
                  ubicacion_id: String(f.get("ubicacion_id") ?? "") || null,
                  asignado_a: String(f.get("asignado_a") ?? "") || null,
                  fecha_adquisicion: String(f.get("fecha_adquisicion") ?? "") || null,
                  valor: String(f.get("valor") ?? ""),
                  vida_util_meses: String(f.get("vida_util_meses") ?? ""),
                  fecha_vencimiento: String(f.get("fecha_vencimiento") ?? "") || null,
                  observacion: String(f.get("observacion") ?? ""),
                }),
              );
            }}
            className="space-y-3"
          >
            {error && <ErrBox texto={error} />}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Campo label="Nombre / descripción *" className="col-span-2 sm:col-span-3">
                <input name="nombre" required defaultValue={modal.act?.nombre ?? ""} className={inp} placeholder="Ej: Radio portátil VHF" />
              </Campo>
              <Campo label="Marca"><input name="marca" defaultValue={modal.act?.marca ?? ""} className={inp} /></Campo>
              <Campo label="Modelo"><input name="modelo" defaultValue={modal.act?.modelo ?? ""} className={inp} /></Campo>
              <Campo label="N° de serie"><input name="numero_serie" defaultValue={modal.act?.numero_serie ?? ""} className={`${inp} font-mono`} /></Campo>
              <Campo label="Categoría *">
                <select name="categoria" defaultValue={modal.act?.categoria ?? "comunicaciones"} className={inp}>
                  {CATEGORIAS_ACTIVO.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Campo>
              <Campo label="Estado *">
                <select name="estado" defaultValue={modal.act?.estado ?? "operativo"} className={inp}>
                  {ESTADOS_ACTIVO.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </Campo>
              <Campo label="Valor ($)"><input name="valor" type="number" step="0.01" defaultValue={modal.act?.valor ?? ""} className={inp} /></Campo>
              <Campo label="Ubicación">
                <select name="ubicacion_id" defaultValue={modal.act?.ubicacion_id ?? ""} className={inp}>
                  <option value="">— Sin asignar —</option>
                  {ubicaciones.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
              </Campo>
              <Campo label="Asignado a (persona)">
                <select name="asignado_a" defaultValue={modal.act?.asignado_a ?? ""} className={inp}>
                  <option value="">— Nadie —</option>
                  {personal.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </Campo>
              <Campo label="Fecha adquisición"><input name="fecha_adquisicion" type="date" defaultValue={modal.act?.fecha_adquisicion?.slice(0, 10) ?? ""} className={inp} /></Campo>
              <Campo label="Vida útil (meses)"><input name="vida_util_meses" type="number" defaultValue={modal.act?.vida_util_meses ?? ""} className={inp} /></Campo>
              <Campo label="Vence cert./garantía"><input name="fecha_vencimiento" type="date" defaultValue={modal.act?.fecha_vencimiento?.slice(0, 10) ?? ""} className={inp} /></Campo>
              <Campo label="Observación" className="col-span-2 sm:col-span-3">
                <textarea name="observacion" defaultValue={modal.act?.observacion ?? ""} className={inp} />
              </Campo>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              {modal.act ? (
                <button type="button" onClick={() => run(() => eliminarActivoAction(modal.act!.id))}
                  className="rounded border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50">Eliminar</button>
              ) : <span />}
              <div className="flex gap-2">
                <button type="button" onClick={() => setModal(null)} className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={pending} className="rounded bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">{pending ? "Guardando…" : "Guardar"}</button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL MANTENCION */}
      {modal?.kind === "mantencion" && (
        <Modal titulo={`🔧 Mantención · ${modal.act.nombre}`} onClose={() => setModal(null)} wide>
          <div className="space-y-4">
            {/* cambio rápido de estado */}
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="text-xs font-medium text-slate-600">Estado actual:</span>
              <Badge label={labelDe(ESTADOS_ACTIVO, modal.act.estado)} color={colorEstado(modal.act.estado)} />
              <span className="mx-1 text-slate-300">|</span>
              {ESTADOS_ACTIVO.map((e) => (
                <button
                  key={e.value}
                  type="button"
                  disabled={pending || e.value === modal.act.estado}
                  onClick={() => run(() => cambiarEstadoActivoAction(modal.act.id, e.value))}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-40"
                >
                  → {e.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                run(() =>
                  crearMantencionAction({
                    activo_id: modal.act.id,
                    fecha: String(f.get("fecha") ?? ""),
                    tipo: String(f.get("tipo") ?? "preventiva"),
                    descripcion: String(f.get("descripcion") ?? ""),
                    costo: String(f.get("costo") ?? ""),
                    proveedor: String(f.get("proveedor") ?? ""),
                    proximo_vencimiento: String(f.get("proximo_vencimiento") ?? "") || null,
                  }),
                );
              }}
              className="space-y-3"
            >
              {error && <ErrBox texto={error} />}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Campo label="Fecha *"><input name="fecha" type="date" required defaultValue={hoyISO()} className={inp} /></Campo>
                <Campo label="Tipo *">
                  <select name="tipo" defaultValue="preventiva" className={inp}>
                    {TIPOS_MANTENCION.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Campo>
                <Campo label="Costo ($)"><input name="costo" type="number" step="0.01" className={inp} /></Campo>
                <Campo label="Proveedor"><input name="proveedor" className={inp} /></Campo>
                <Campo label="Próximo vencimiento"><input name="proximo_vencimiento" type="date" className={inp} /></Campo>
                <Campo label="Descripción" className="col-span-2 sm:col-span-3"><textarea name="descripcion" className={inp} placeholder="Ej: cambio de batería, calibración…" /></Campo>
              </div>
              <Acciones pending={pending} onClose={() => setModal(null)} label="Registrar mantención" />
            </form>

            {/* historial */}
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Historial</p>
              {(mantPorActivo.get(modal.act.id) ?? []).length === 0 ? (
                <p className="rounded border border-slate-200 bg-white p-3 text-sm text-slate-500">Sin mantenciones registradas.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Fecha</th>
                        <th className="px-3 py-2">Tipo</th>
                        <th className="px-3 py-2">Descripción</th>
                        <th className="px-3 py-2 text-right">Costo</th>
                        <th className="px-3 py-2">Próx. venc.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(mantPorActivo.get(modal.act.id) ?? []).map((m) => (
                        <tr key={m.id}>
                          <td className="px-3 py-2 text-xs text-slate-600">{fDate(m.fecha)}</td>
                          <td className="px-3 py-2">{labelDe(TIPOS_MANTENCION, m.tipo)}</td>
                          <td className="px-3 py-2 text-slate-600">{m.descripcion ?? "—"}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-600">{m.costo != null ? fCLP(m.costo) : "—"}</td>
                          <td className="px-3 py-2 text-xs text-slate-600">{fDate(m.proximo_vencimiento)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
