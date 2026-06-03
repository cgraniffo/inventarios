"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Activo, Personal, Ubicacion } from "@/lib/types";
import { fDate, fNum, hoyISO } from "@/lib/format";
import { ESTADOS_ASIGNACION, labelDe } from "@/lib/constants";
import { Modal, Campo, ErrBox, Vacio, Badge, inp } from "@/components/ui";
import { SignaturePad } from "@/components/signature-pad";
import {
  crearAsignacionAction,
  devolverItemAction,
  firmarAsignacionAction,
  quitarFirmaAction,
  type ItemInput,
} from "./_actions";

export type ArticuloOpt = {
  id: string;
  nombre: string;
  unidad: string;
  talla: string | null;
  stock: number;
  requiereDevolucion: boolean;
};

export type AsignacionFull = {
  id: string;
  folio: number;
  persona: string;
  fechaEntrega: string;
  estado: string;
  firmada: boolean;
  firmaData: string | null;
  firmadaAt: string | null;
  observacion: string | null;
  items: {
    id: string;
    tipo: "articulo" | "activo";
    nombre: string;
    detalle: string;
    cantidad: number;
    estado: string;
    fechaDevolucion: string | null;
  }[];
};

type Draft = { tipo: "articulo" | "activo"; ref: string; cantidad: string; talla: string };

const colorEstado = (e: string) => ESTADOS_ASIGNACION.find((x) => x.value === e)?.color ?? "gray";
const colorItem = (e: string) =>
  e === "entregado" ? "blue" : e === "devuelto" ? "emerald" : e === "perdido" ? "rose" : "gray";

export function AsignacionesCliente({
  asignaciones,
  personal,
  ubicaciones,
  articulos,
  activos,
}: {
  asignaciones: AsignacionFull[];
  personal: Pick<Personal, "id" | "nombre">[];
  ubicaciones: Pick<Ubicacion, "id" | "nombre">[];
  articulos: ArticuloOpt[];
  activos: Pick<Activo, "id" | "nombre" | "numero_serie" | "marca">[];
}) {
  const router = useRouter();
  const [modal, setModal] = useState<
    | null
    | { kind: "nueva" }
    | { kind: "detalle"; a: AsignacionFull }
    | { kind: "firmar"; a: AsignacionFull }
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");

  // Form nueva entrega
  const [persona, setPersona] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [obs, setObs] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const filt = asignaciones.filter(
    (a) => `${a.folio} ${a.persona}`.toLowerCase().includes(q.toLowerCase()),
  );

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, cerrar = true) {
    setError(null);
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (cerrar) setModal(null);
        router.refresh();
      } else setError(r.error ?? "No se pudo guardar.");
    });
  }

  function abrirNueva() {
    setPersona("");
    setUbicacion("");
    setFecha(hoyISO());
    setObs("");
    setDrafts([{ tipo: "articulo", ref: "", cantidad: "1", talla: "" }]);
    setError(null);
    setModal({ kind: "nueva" });
  }

  function guardarNueva() {
    const items: ItemInput[] = drafts
      .filter((d) => d.ref)
      .map((d) =>
        d.tipo === "articulo"
          ? { tipo: "articulo", articulo_id: d.ref, cantidad: d.cantidad, talla: d.talla || null }
          : { tipo: "activo", activo_id: d.ref },
      );
    run(() =>
      crearAsignacionAction({
        personal_id: persona,
        ubicacion_id: ubicacion || null,
        fecha_entrega: fecha,
        observacion: obs,
        items,
      }),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por folio o persona…"
          className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm" />
        <button type="button" onClick={abrirNueva}
          className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
          + Nueva entrega
        </button>
      </div>

      {error && !modal && <ErrBox texto={error} />}

      {filt.length === 0 ? (
        <Vacio texto="Sin asignaciones. Crea un acta de entrega con + Nueva entrega." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Acta</th>
                <th className="px-3 py-2">Persona</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2 text-right">Ítems</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Firma</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filt.map((a) => {
                const pend = a.items.filter((i) => i.estado === "entregado").length;
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-xs font-semibold text-slate-700">#{a.folio}</td>
                    <td className="px-3 py-2 font-medium text-slate-900">{a.persona}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{fDate(a.fechaEntrega)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                      {a.items.length}
                      {pend > 0 && <span className="ml-1 text-[11px] text-amber-700">({pend} pend.)</span>}
                    </td>
                    <td className="px-3 py-2"><Badge label={labelDe(ESTADOS_ASIGNACION, a.estado)} color={colorEstado(a.estado)} /></td>
                    <td className="px-3 py-2">{a.firmada ? "✅" : <span className="text-xs text-slate-400">pendiente</span>}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <a href={`/api/asignaciones/${a.id}/pdf`} target="_blank" rel="noopener noreferrer"
                        title="Descargar acta en PDF"
                        className="mr-1 inline-block rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">📄 PDF</a>
                      <button type="button" onClick={() => { setError(null); setModal({ kind: "detalle", a }); }}
                        className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">Ver / devolver</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL NUEVA */}
      {modal?.kind === "nueva" && (
        <Modal titulo="Nueva entrega (acta de cargo)" onClose={() => setModal(null)} wide>
          <div className="space-y-3">
            {error && <ErrBox texto={error} />}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Campo label="Persona *">
                <select value={persona} onChange={(e) => setPersona(e.target.value)} className={inp}>
                  <option value="">— Selecciona —</option>
                  {personal.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </Campo>
              <Campo label="Fecha entrega">
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inp} />
              </Campo>
              <Campo label="Puesto / ubicación">
                <select value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} className={inp}>
                  <option value="">— Sin asignar —</option>
                  {ubicaciones.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
              </Campo>
            </div>

            {/* Ítems */}
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Ítems a entregar</p>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setDrafts((d) => [...d, { tipo: "articulo", ref: "", cantidad: "1", talla: "" }])}
                    className="rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100">+ Artículo/EPP</button>
                  <button type="button" onClick={() => setDrafts((d) => [...d, { tipo: "activo", ref: "", cantidad: "1", talla: "" }])}
                    className="rounded border border-blue-300 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800 hover:bg-blue-100">+ Activo serializado</button>
                </div>
              </div>

              {drafts.length === 0 ? (
                <p className="py-3 text-center text-xs text-slate-400">Agrega ítems con los botones de arriba.</p>
              ) : (
                <div className="space-y-2">
                  {drafts.map((d, idx) => (
                    <div key={idx} className="flex flex-wrap items-end gap-2 rounded border border-slate-100 bg-slate-50 p-2">
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                        {d.tipo === "articulo" ? <Badge label="Artículo" color="emerald" /> : <Badge label="Activo" color="blue" />}
                      </span>
                      {d.tipo === "articulo" ? (
                        <>
                          <label className="flex-1">
                            <select
                              value={d.ref}
                              onChange={(e) => {
                                const art = articulos.find((a) => a.id === e.target.value);
                                setDrafts((arr) => arr.map((x, i) => (i === idx ? { ...x, ref: e.target.value, talla: art?.talla ?? x.talla } : x)));
                              }}
                              className={inp}
                            >
                              <option value="">— Artículo —</option>
                              {articulos.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.nombre}{a.talla ? ` (${a.talla})` : ""} · stock {fNum(a.stock)} {a.unidad}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="w-20">
                            <input type="number" step="0.01" min="0" value={d.cantidad}
                              onChange={(e) => setDrafts((arr) => arr.map((x, i) => (i === idx ? { ...x, cantidad: e.target.value } : x)))}
                              className={inp} placeholder="Cant." />
                          </label>
                          <label className="w-24">
                            <input value={d.talla}
                              onChange={(e) => setDrafts((arr) => arr.map((x, i) => (i === idx ? { ...x, talla: e.target.value } : x)))}
                              className={inp} placeholder="Talla" />
                          </label>
                        </>
                      ) : (
                        <label className="flex-1">
                          <select value={d.ref}
                            onChange={(e) => setDrafts((arr) => arr.map((x, i) => (i === idx ? { ...x, ref: e.target.value } : x)))}
                            className={inp}>
                            <option value="">— Activo (operativo) —</option>
                            {activos.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.nombre}{a.marca ? ` ${a.marca}` : ""}{a.numero_serie ? ` · S/N ${a.numero_serie}` : ""}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      <button type="button" onClick={() => setDrafts((arr) => arr.filter((_, i) => i !== idx))}
                        className="rounded border border-rose-300 px-2 py-1.5 text-xs text-rose-700 hover:bg-rose-50">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Campo label="Observación">
              <textarea value={obs} onChange={(e) => setObs(e.target.value)} className={inp} placeholder="Ej: entrega por inicio de turno…" />
            </Campo>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button type="button" onClick={() => setModal(null)} className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button type="button" onClick={guardarNueva} disabled={pending}
                className="rounded bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                {pending ? "Guardando…" : "Crear acta"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL DETALLE */}
      {modal?.kind === "detalle" && (
        <Modal titulo={`Acta #${modal.a.folio} · ${modal.a.persona}`} onClose={() => setModal(null)} wide>
          <div className="space-y-3">
            {error && <ErrBox texto={error} />}
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span>📅 {fDate(modal.a.fechaEntrega)}</span>
              <Badge label={labelDe(ESTADOS_ASIGNACION, modal.a.estado)} color={colorEstado(modal.a.estado)} />
              {!modal.a.firmaData && (
                <button
                  type="button"
                  onClick={() => { setError(null); setModal({ kind: "firmar", a: modal.a }); }}
                  className="rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  ✍️ Firmar acta
                </button>
              )}
              <a
                href={`/api/asignaciones/${modal.a.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900"
              >
                📄 Descargar / Imprimir PDF
              </a>
            </div>

            {modal.a.firmaData && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={modal.a.firmaData} alt="Firma" className="h-16 rounded border border-slate-200 bg-white" />
                <div className="text-xs text-emerald-900">
                  <p className="font-semibold">✅ Acta firmada</p>
                  {modal.a.firmadaAt && <p className="text-emerald-700">{fDate(modal.a.firmadaAt)}</p>}
                  <button
                    type="button"
                    onClick={() => run(() => quitarFirmaAction(modal.a.id), false)}
                    className="mt-1 text-rose-700 hover:underline"
                  >
                    Quitar firma
                  </button>
                </div>
              </div>
            )}

            {modal.a.observacion && <p className="rounded bg-slate-50 px-3 py-2 text-sm text-slate-600">{modal.a.observacion}</p>}

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Ítem</th>
                    <th className="px-3 py-2">Detalle</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modal.a.items.map((it) => (
                    <tr key={it.id}>
                      <td className="px-3 py-2">
                        {it.tipo === "activo" ? "📻 " : "📦 "}
                        <span className="font-medium text-slate-900">{it.nombre}</span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{it.detalle}</td>
                      <td className="px-3 py-2">
                        <Badge label={it.estado} color={colorItem(it.estado)} />
                        {it.fechaDevolucion && <span className="ml-1 text-[11px] text-slate-400">{fDate(it.fechaDevolucion)}</span>}
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {it.estado === "entregado" ? (
                          <>
                            <button type="button" disabled={pending} onClick={() => run(() => devolverItemAction(it.id, "devuelto"), false)}
                              className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">↩ Devolver</button>
                            <button type="button" disabled={pending} onClick={() => run(() => devolverItemAction(it.id, "perdido"), false)}
                              title="Marcar como perdido" className="ml-1 rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-50">Perdido</button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400">
              Devolver un artículo reingresa su stock; devolver un activo lo deja operativo. &quot;Perdido&quot; no reingresa stock y marca el activo como extraviado.
            </p>
          </div>
        </Modal>
      )}

      {/* MODAL FIRMA */}
      {modal?.kind === "firmar" && (
        <Modal titulo={`✍️ Firmar acta #${modal.a.folio} · ${modal.a.persona}`} onClose={() => setModal(null)}>
          <div className="space-y-3">
            {error && <ErrBox texto={error} />}
            <SignaturePad
              pending={pending}
              onCancel={() => setModal({ kind: "detalle", a: modal.a })}
              onSave={(dataUrl) => run(() => firmarAsignacionAction(modal.a.id, dataUrl))}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
