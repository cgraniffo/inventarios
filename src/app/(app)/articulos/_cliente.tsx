"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { StockCalc } from "@/lib/inventario/stock";
import { ICONO_SEMAFORO } from "@/lib/inventario/stock";
import type { Ubicacion } from "@/lib/types";
import { fCLP, fNum, fDate, hoyISO } from "@/lib/format";
import { CATEGORIAS_ARTICULO, UNIDADES, TALLAS, labelDe } from "@/lib/constants";
import { Modal, Campo, Acciones, ErrBox, Vacio, Badge, inp } from "@/components/ui";
import {
  guardarArticuloAction,
  eliminarArticuloAction,
  crearMovimientoAction,
  ajustarStockAction,
} from "./_actions";

export type MovRow = {
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

type Modal =
  | null
  | { kind: "articulo"; art?: StockCalc }
  | { kind: "ajuste"; art: StockCalc }
  | { kind: "mov"; art?: StockCalc };

export function ArticulosCliente({
  stock,
  movimientos,
  ubicaciones,
}: {
  stock: StockCalc[];
  movimientos: MovRow[];
  ubicaciones: Pick<Ubicacion, "id" | "nombre">[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"stock" | "movs" | "maestro">("stock");
  const [modal, setModal] = useState<Modal>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [sem, setSem] = useState("");
  const [tipoM, setTipoM] = useState("");
  const [esEppForm, setEsEppForm] = useState(false);

  const categorias = useMemo(
    () => Array.from(new Set(stock.map((s) => s.categoria).filter(Boolean))),
    [stock],
  );

  const stockFilt = stock.filter((s) => {
    if (cat && s.categoria !== cat) return false;
    if (sem && s.semaforo !== sem) return false;
    if (q && !`${s.nombre} ${s.codigo ?? ""} ${s.talla ?? ""}`.toLowerCase().includes(q.toLowerCase()))
      return false;
    return true;
  });
  const movsFilt = movimientos.filter((m) => {
    if (tipoM && m.tipo !== tipoM) return false;
    if (q && !m.articulo.toLowerCase().includes(q.toLowerCase())) return false;
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

  function abrirArticulo(art?: StockCalc) {
    setEsEppForm(art ? art.es_epp : false);
    setModal({ kind: "articulo", art });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {([["stock", "Stock actual"], ["movs", "Movimientos"], ["maestro", "Maestro"]] as const).map(
          ([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                tab === k
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {error && !modal && <ErrBox texto={error} />}

      {/* STOCK */}
      {tab === "stock" && (
        <>
          <Filtros q={q} setQ={setQ}>
            <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded border border-slate-300 px-2 py-1.5 text-sm">
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c} value={c}>{labelDe(CATEGORIAS_ARTICULO, c)}</option>
              ))}
            </select>
            <select value={sem} onChange={(e) => setSem(e.target.value)} className="rounded border border-slate-300 px-2 py-1.5 text-sm">
              <option value="">Todos</option>
              <option value="rojo">🔴 Sin stock</option>
              <option value="amarillo">🟡 Bajo mínimo</option>
              <option value="verde">🟢 OK</option>
            </select>
            <button type="button" onClick={() => setModal({ kind: "mov" })}
              className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
              + Movimiento
            </button>
          </Filtros>

          {stockFilt.length === 0 ? (
            <Vacio texto="No hay artículos. Créalos en la pestaña Maestro." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2"></th>
                    <th className="px-3 py-2">Artículo</th>
                    <th className="px-3 py-2">Categoría</th>
                    <th className="px-3 py-2">Talla</th>
                    <th className="px-3 py-2 text-right">Stock</th>
                    <th className="px-3 py-2 text-right">Mínimo</th>
                    <th className="px-3 py-2 text-right">$ Unit.</th>
                    <th className="px-3 py-2 text-right">Valorización</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockFilt.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2">{ICONO_SEMAFORO[s.semaforo]}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {s.nombre}
                        {s.es_epp && <span className="ml-1.5"><Badge label="EPP" color="violet" /></span>}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{labelDe(CATEGORIAS_ARTICULO, s.categoria)}</td>
                      <td className="px-3 py-2 text-slate-600">{s.talla ?? "—"}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">
                        {fNum(s.stockActual)} <span className="text-xs text-slate-400">{s.unidad}</span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-500">{fNum(s.stock_minimo)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-500">{fCLP(s.precio_referencia)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">{fCLP(s.valorizacion)}</td>
                      <td className="px-3 py-2 text-right">
                        <button type="button" onClick={() => setModal({ kind: "ajuste", art: s })}
                          title="Ajustar por conteo" className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">⚖️ Ajustar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* MOVIMIENTOS */}
      {tab === "movs" && (
        <>
          <Filtros q={q} setQ={setQ}>
            <select value={tipoM} onChange={(e) => setTipoM(e.target.value)} className="rounded border border-slate-300 px-2 py-1.5 text-sm">
              <option value="">Todos los tipos</option>
              <option value="entrada">Entradas</option>
              <option value="salida">Salidas</option>
              <option value="ajuste">Ajustes</option>
            </select>
          </Filtros>
          {movsFilt.length === 0 ? (
            <Vacio texto="Sin movimientos registrados." />
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
                  {movsFilt.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-xs text-slate-600">{fDate(m.fecha)}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">{m.articulo}</td>
                      <td className="px-3 py-2">
                        <Badge
                          label={m.tipo}
                          color={m.tipo === "entrada" ? "emerald" : m.tipo === "salida" ? "rose" : "blue"}
                        />
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
        </>
      )}

      {/* MAESTRO */}
      {tab === "maestro" && (
        <>
          <Filtros q={q} setQ={setQ}>
            <button type="button" onClick={() => abrirArticulo()}
              className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
              + Nuevo artículo
            </button>
          </Filtros>
          {stockFilt.length === 0 ? (
            <Vacio texto="Sin artículos. Crea EPP, uniformes o consumibles con + Nuevo artículo." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Artículo</th>
                    <th className="px-3 py-2">Categoría</th>
                    <th className="px-3 py-2">Talla</th>
                    <th className="px-3 py-2">Norma</th>
                    <th className="px-3 py-2 text-right">Vida útil</th>
                    <th className="px-3 py-2 text-right">Mínimo</th>
                    <th className="px-3 py-2 text-right">$ Unit.</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockFilt.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {s.nombre}
                        {s.requiere_devolucion && <span className="ml-1.5"><Badge label="Devolución" color="amber" /></span>}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{labelDe(CATEGORIAS_ARTICULO, s.categoria)}</td>
                      <td className="px-3 py-2 text-slate-600">{s.talla ?? "—"}</td>
                      <td className="px-3 py-2 text-slate-600">{s.norma_certificacion ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-500">{s.vida_util_meses ? `${s.vida_util_meses} m` : "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-500">{fNum(s.stock_minimo)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-500">{fCLP(s.precio_referencia)}</td>
                      <td className="px-3 py-2 text-right">
                        <button type="button" onClick={() => abrirArticulo(s)}
                          className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">✏️ Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* MODAL ARTICULO */}
      {modal?.kind === "articulo" && (
        <Modal titulo={modal.art ? "Editar artículo" : "Nuevo artículo"} onClose={() => setModal(null)} wide>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run(() =>
                guardarArticuloAction({
                  id: modal.art?.id,
                  nombre: String(f.get("nombre") ?? ""),
                  codigo: String(f.get("codigo") ?? ""),
                  categoria: String(f.get("categoria") ?? "consumible"),
                  unidad: String(f.get("unidad") ?? "un"),
                  es_epp: f.get("es_epp") === "on",
                  talla: String(f.get("talla") ?? ""),
                  norma_certificacion: String(f.get("norma") ?? ""),
                  vida_util_meses: String(f.get("vida_util_meses") ?? ""),
                  requiere_devolucion: f.get("requiere_devolucion") === "on",
                  stock_inicial: String(f.get("stock_inicial") ?? ""),
                  fecha_stock_inicial: String(f.get("fecha_stock_inicial") ?? "") || null,
                  stock_minimo: String(f.get("stock_minimo") ?? ""),
                  umbral_rojo: String(f.get("umbral_rojo") ?? ""),
                  umbral_amarillo: String(f.get("umbral_amarillo") ?? ""),
                  precio_referencia: String(f.get("precio") ?? ""),
                  ubicacion_id: String(f.get("ubicacion_id") ?? "") || null,
                  observacion: String(f.get("observacion") ?? ""),
                }),
              );
            }}
            className="space-y-3"
          >
            {error && <ErrBox texto={error} />}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Campo label="Artículo *" className="col-span-2 sm:col-span-3">
                <input name="nombre" required defaultValue={modal.art?.nombre ?? ""} className={inp} />
              </Campo>
              <Campo label="Categoría *">
                <select name="categoria" defaultValue={modal.art?.categoria ?? "consumible"} className={inp}>
                  {CATEGORIAS_ARTICULO.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Campo>
              <Campo label="Unidad *">
                <select name="unidad" defaultValue={modal.art?.unidad ?? "un"} className={inp}>
                  {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </Campo>
              <Campo label="Código">
                <input name="codigo" defaultValue={modal.art?.codigo ?? ""} className={inp} />
              </Campo>
              <Campo label="Bodega por defecto">
                <select name="ubicacion_id" defaultValue={modal.art?.ubicacion_id ?? ""} className={inp}>
                  <option value="">— Sin asignar —</option>
                  {ubicaciones.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
              </Campo>
              <Campo label="Stock inicial">
                <input name="stock_inicial" type="number" step="0.01" defaultValue={modal.art?.stock_inicial ?? 0} className={inp} />
              </Campo>
              <Campo label="Stock mínimo">
                <input name="stock_minimo" type="number" step="0.01" defaultValue={modal.art?.stock_minimo ?? 0} className={inp} />
              </Campo>
              <Campo label="Precio unitario ($)">
                <input name="precio" type="number" step="0.01" defaultValue={modal.art?.precio_referencia ?? 0} className={inp} />
              </Campo>
            </div>

            {/* Bloque EPP */}
            <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-violet-900">
                <input type="checkbox" name="es_epp" defaultChecked={modal.art?.es_epp ?? false}
                  onChange={(e) => setEsEppForm(e.target.checked)} />
                Es EPP / uniforme (talla, certificación y vida útil)
              </label>
              {esEppForm && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Campo label="Talla">
                    <select name="talla" defaultValue={modal.art?.talla ?? ""} className={inp}>
                      <option value="">—</option>
                      {TALLAS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Campo>
                  <Campo label="Norma / certificación" className="col-span-2">
                    <input name="norma" defaultValue={modal.art?.norma_certificacion ?? ""} className={inp} placeholder="Ej: EN 388, NCh1801" />
                  </Campo>
                  <Campo label="Vida útil (meses)">
                    <input name="vida_util_meses" type="number" defaultValue={modal.art?.vida_util_meses ?? ""} className={inp} />
                  </Campo>
                  <label className="col-span-2 mt-1 flex items-center gap-2 text-xs font-medium text-slate-700 sm:col-span-4">
                    <input type="checkbox" name="requiere_devolucion" defaultChecked={modal.art?.requiere_devolucion ?? false} />
                    Requiere devolución al término del contrato (es cargo, no consumible)
                  </label>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Campo label="Fecha del conteo inicial">
                <input name="fecha_stock_inicial" type="date" defaultValue={modal.art?.fecha_stock_inicial?.slice(0, 10) ?? ""} className={inp} />
              </Campo>
              <Campo label="🔴 Umbral rojo (opc.)">
                <input name="umbral_rojo" type="number" step="0.01" defaultValue={modal.art?.umbral_rojo ?? ""} className={inp} />
              </Campo>
              <Campo label="🟡 Umbral amarillo (opc.)">
                <input name="umbral_amarillo" type="number" step="0.01" defaultValue={modal.art?.umbral_amarillo ?? ""} className={inp} />
              </Campo>
              <Campo label="Observación" className="col-span-2 sm:col-span-3">
                <textarea name="observacion" defaultValue={modal.art?.observacion ?? ""} className={inp} />
              </Campo>
              <p className="col-span-2 rounded bg-slate-50 px-2 py-1 text-[11px] text-slate-500 sm:col-span-3">
                Si dejas los umbrales vacíos: 🔴 ≤ 50% del mínimo · 🟡 ≤ mínimo.
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              {modal.art ? (
                <button type="button" onClick={() => run(() => eliminarArticuloAction(modal.art!.id))}
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

      {/* MODAL AJUSTE */}
      {modal?.kind === "ajuste" && (
        <Modal titulo="Ajustar stock" onClose={() => setModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run(() => ajustarStockAction(modal.art.id, Number(f.get("stock_real")), String(f.get("obs") ?? "")));
            }}
            className="space-y-3"
          >
            {error && <ErrBox texto={error} />}
            <p className="text-sm text-slate-600">
              <strong>{modal.art.nombre}</strong>
              <br />
              Stock actual: <strong>{fNum(modal.art.stockActual)} {modal.art.unidad}</strong>
            </p>
            <Campo label="Stock real (resultado del conteo) *">
              <input name="stock_real" type="number" step="0.01" required defaultValue={modal.art.stockActual} className={inp} />
            </Campo>
            <Campo label="Motivo / observación">
              <textarea name="obs" className={inp} placeholder="Ej: conteo físico mensual, merma, extravío…" />
            </Campo>
            <Acciones pending={pending} onClose={() => setModal(null)} label="Registrar ajuste" />
          </form>
        </Modal>
      )}

      {/* MODAL MOVIMIENTO */}
      {modal?.kind === "mov" && (
        <Modal titulo="Nuevo movimiento" onClose={() => setModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run(() =>
                crearMovimientoAction({
                  articulo_id: String(f.get("articulo_id")),
                  tipo: f.get("tipo") === "salida" ? "salida" : "entrada",
                  cantidad: Number(f.get("cantidad")),
                  fecha: String(f.get("fecha") ?? "") || null,
                  observacion: String(f.get("obs") ?? ""),
                }),
              );
            }}
            className="space-y-3"
          >
            {error && <ErrBox texto={error} />}
            <Campo label="Artículo *">
              <select name="articulo_id" required defaultValue={modal.art?.id ?? ""} className={inp}>
                <option value="">— Selecciona —</option>
                {stock.map((s) => <option key={s.id} value={s.id}>{s.nombre} ({s.unidad}){s.talla ? ` · ${s.talla}` : ""}</option>)}
              </select>
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Tipo *">
                <select name="tipo" defaultValue="entrada" className={inp}>
                  <option value="entrada">Entrada (+)</option>
                  <option value="salida">Salida (−)</option>
                </select>
              </Campo>
              <Campo label="Cantidad *">
                <input name="cantidad" type="number" step="0.01" required className={inp} />
              </Campo>
            </div>
            <Campo label="Fecha">
              <input name="fecha" type="date" defaultValue={hoyISO()} className={inp} />
            </Campo>
            <Campo label="Observación">
              <textarea name="obs" className={inp} />
            </Campo>
            <Acciones pending={pending} onClose={() => setModal(null)} label="Registrar" />
          </form>
        </Modal>
      )}
    </div>
  );
}

function Filtros({ q, setQ, children }: { q: string; setQ: (v: string) => void; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…"
        className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm" />
      {children}
    </div>
  );
}
