import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Activo, Articulo } from "@/lib/types";
import { calcularStock } from "@/lib/inventario/stock";
import { fDate, fNum, diasHasta } from "@/lib/format";
import { labelDe, ESTADOS_ACTIVO } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { PageInfo } from "@/components/page-info";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

/** Suma meses a una fecha YYYY-MM-DD y devuelve ISO YYYY-MM-DD. */
function sumarMeses(fecha: string, meses: number): string {
  const d = new Date(fecha.slice(0, 10));
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().slice(0, 10);
}

const DIAS_AVISO = 30;

export default async function AlertasPage() {
  const supabase = await createClient();
  const [{ data: arts }, { data: movs }, { data: act }, { data: items }] = await Promise.all([
    supabase.from("articulos").select("*").is("deleted_at", null),
    supabase.from("inventario_movimientos").select("articulo_id, cantidad"),
    supabase.from("activos").select("*").is("deleted_at", null),
    supabase
      .from("asignacion_items")
      .select("estado, articulos(nombre), activos(nombre), asignaciones(folio, fecha_entrega, personal(nombre))")
      .eq("estado", "entregado"),
  ]);

  const stock = calcularStock(
    (arts ?? []) as Articulo[],
    (movs ?? []).map((m) => ({ articulo_id: m.articulo_id as string, cantidad: m.cantidad as number })),
  );

  // 1) Stock bajo / sin stock
  const stockBajo = stock
    .filter((s) => s.semaforo !== "verde")
    .sort((a, b) => (a.semaforo === b.semaforo ? 0 : a.semaforo === "rojo" ? -1 : 1));

  // 2) EPP por vencer (fecha_stock_inicial + vida_util_meses)
  const eppVencer = stock
    .filter((s) => s.es_epp && s.vida_util_meses && s.fecha_stock_inicial)
    .map((s) => {
      const venc = sumarMeses(s.fecha_stock_inicial as string, s.vida_util_meses as number);
      return { ...s, venc, dias: diasHasta(venc) };
    })
    .filter((s) => s.dias != null && s.dias <= DIAS_AVISO)
    .sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0));

  // 3) Activos con certificación/garantía por vencer
  const activos = (act ?? []) as Activo[];
  const certVencer = activos
    .filter((a) => a.fecha_vencimiento)
    .map((a) => ({ ...a, dias: diasHasta(a.fecha_vencimiento) }))
    .filter((a) => a.dias != null && a.dias <= DIAS_AVISO)
    .sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0));

  // 4) Activos en reparación / extraviados
  const activosProblema = activos.filter((a) => a.estado === "en_reparacion" || a.estado === "extraviado");

  // 5) Devoluciones pendientes
  const pendientes = (items ?? []).map((it) => {
    const a = Array.isArray(it.articulos) ? it.articulos[0] : it.articulos;
    const v = Array.isArray(it.activos) ? it.activos[0] : it.activos;
    const asig = Array.isArray(it.asignaciones) ? it.asignaciones[0] : it.asignaciones;
    const per = asig ? (Array.isArray(asig.personal) ? asig.personal[0] : asig.personal) : null;
    return {
      nombre: (a as { nombre?: string } | null)?.nombre ?? (v as { nombre?: string } | null)?.nombre ?? "—",
      folio: (asig as { folio?: number } | null)?.folio ?? "—",
      fecha: (asig as { fecha_entrega?: string } | null)?.fecha_entrega ?? null,
      persona: (per as { nombre?: string } | null)?.nombre ?? "—",
    };
  });

  const totalAlertas =
    stockBajo.length + eppVencer.length + certVencer.length + activosProblema.length;

  return (
    <div>
      <PageHeader
        titulo="🔔 Alertas"
        subtitulo="Stock crítico, EPP por vencer, certificaciones de activos y devoluciones pendientes."
      />
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <PageInfo seccion="alertas" />
        {totalAlertas === 0 && pendientes.length === 0 && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center text-sm text-emerald-800">
            🎉 Todo en orden. Sin alertas activas.
          </div>
        )}

        <Seccion titulo="📉 Stock bajo o sin stock" count={stockBajo.length} href="/articulos">
          {stockBajo.map((s) => (
            <Fila key={s.id}>
              <span>{s.semaforo === "rojo" ? "🔴" : "🟡"} <strong>{s.nombre}</strong>{s.talla ? ` · ${s.talla}` : ""}</span>
              <span className="text-slate-600">{fNum(s.stockActual)} / mín {fNum(s.stock_minimo)} {s.unidad}</span>
            </Fila>
          ))}
        </Seccion>

        <Seccion titulo="🦺 EPP por vencer (vida útil)" count={eppVencer.length} href="/articulos">
          {eppVencer.map((s) => (
            <Fila key={s.id}>
              <span><strong>{s.nombre}</strong>{s.talla ? ` · ${s.talla}` : ""}</span>
              <span className={(s.dias ?? 0) < 0 ? "font-semibold text-rose-700" : "text-amber-700"}>
                {(s.dias ?? 0) < 0 ? `vencido (${fDate(s.venc)})` : `vence ${fDate(s.venc)} · ${s.dias}d`}
              </span>
            </Fila>
          ))}
        </Seccion>

        <Seccion titulo="📻 Certificación / garantía de activos" count={certVencer.length} href="/activos">
          {certVencer.map((a) => (
            <Fila key={a.id}>
              <span><strong>{a.nombre}</strong>{a.numero_serie ? ` · S/N ${a.numero_serie}` : ""}</span>
              <span className={(a.dias ?? 0) < 0 ? "font-semibold text-rose-700" : "text-amber-700"}>
                {(a.dias ?? 0) < 0 ? `vencida (${fDate(a.fecha_vencimiento)})` : `vence ${fDate(a.fecha_vencimiento)} · ${a.dias}d`}
              </span>
            </Fila>
          ))}
        </Seccion>

        <Seccion titulo="🔧 Activos en reparación / extraviados" count={activosProblema.length} href="/activos">
          {activosProblema.map((a) => (
            <Fila key={a.id}>
              <span><strong>{a.nombre}</strong>{a.numero_serie ? ` · S/N ${a.numero_serie}` : ""}</span>
              <Badge label={labelDe(ESTADOS_ACTIVO, a.estado)} color={a.estado === "extraviado" ? "rose" : "amber"} />
            </Fila>
          ))}
        </Seccion>

        <Seccion titulo="📋 Devoluciones pendientes" count={pendientes.length} href="/asignaciones">
          {pendientes.map((p, i) => (
            <Fila key={i}>
              <span>📦 <strong>{p.nombre}</strong> · {p.persona}</span>
              <span className="text-slate-600">Acta #{p.folio} · {fDate(p.fecha)}</span>
            </Fila>
          ))}
        </Seccion>
      </div>
    </div>
  );
}

function Seccion({
  titulo,
  count,
  href,
  children,
}: {
  titulo: string;
  count: number;
  href: string;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-slate-800">
          {titulo} <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{count}</span>
        </h2>
        <Link href={href} className="text-xs font-medium text-emerald-700 hover:underline">Ver módulo →</Link>
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </section>
  );
}

function Fila({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 px-4 py-2 text-sm">{children}</div>;
}
