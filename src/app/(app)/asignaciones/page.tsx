import { createClient } from "@/lib/supabase/server";
import type { Activo, Articulo, Personal, Ubicacion } from "@/lib/types";
import { calcularStock } from "@/lib/inventario/stock";
import { PageHeader } from "@/components/page-header";
import { PageInfo } from "@/components/page-info";
import { Kpi } from "@/components/kpi";
import { AsignacionesCliente, type AsignacionFull, type ArticuloOpt } from "./_cliente";

export const dynamic = "force-dynamic";

export default async function AsignacionesPage() {
  const supabase = await createClient();

  const [{ data: asigs }, { data: items }, { data: per }, { data: ubi }, { data: arts }, { data: movs }, { data: act }] =
    await Promise.all([
      supabase.from("asignaciones").select("*").is("deleted_at", null).order("folio", { ascending: false }),
      supabase
        .from("asignacion_items")
        .select("id, asignacion_id, articulo_id, activo_id, cantidad, talla, fecha_devolucion, estado, articulos(nombre, unidad), activos(nombre, numero_serie)"),
      supabase.from("personal").select("id, nombre").is("deleted_at", null).order("nombre"),
      supabase.from("ubicaciones").select("id, nombre").is("deleted_at", null).order("nombre"),
      supabase.from("articulos").select("*").is("deleted_at", null).order("nombre"),
      supabase.from("inventario_movimientos").select("articulo_id, cantidad"),
      supabase.from("activos").select("id, nombre, numero_serie, marca").eq("estado", "operativo").is("deleted_at", null).order("nombre"),
    ]);

  const personal = (per ?? []) as Pick<Personal, "id" | "nombre">[];
  const perNombre = new Map(personal.map((p) => [p.id, p.nombre]));

  // Stock disponible por artículo (para el formulario de entrega).
  const stock = calcularStock((arts ?? []) as Articulo[], (movs ?? []).map((m) => ({ articulo_id: m.articulo_id as string, cantidad: m.cantidad as number })));
  const articulosOpt: ArticuloOpt[] = stock.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    unidad: s.unidad,
    talla: s.talla,
    stock: s.stockActual,
    requiereDevolucion: s.requiere_devolucion,
  }));

  // Ítems agrupados por asignación.
  const itemsPorAsig = new Map<string, AsignacionFull["items"]>();
  for (const it of items ?? []) {
    const a = Array.isArray(it.articulos) ? it.articulos[0] : it.articulos;
    const v = Array.isArray(it.activos) ? it.activos[0] : it.activos;
    const arr = itemsPorAsig.get(it.asignacion_id as string) ?? [];
    arr.push({
      id: it.id as string,
      tipo: it.articulo_id ? "articulo" : "activo",
      nombre: it.articulo_id
        ? (a as { nombre?: string } | null)?.nombre ?? "—"
        : (v as { nombre?: string } | null)?.nombre ?? "—",
      detalle: it.articulo_id
        ? `${Number(it.cantidad)} ${(a as { unidad?: string } | null)?.unidad ?? ""}${it.talla ? ` · ${it.talla}` : ""}`
        : (v as { numero_serie?: string } | null)?.numero_serie ?? "",
      cantidad: Number(it.cantidad),
      estado: it.estado as string,
      fechaDevolucion: (it.fecha_devolucion as string) ?? null,
    });
    itemsPorAsig.set(it.asignacion_id as string, arr);
  }

  const asignaciones: AsignacionFull[] = (asigs ?? []).map((a) => ({
    id: a.id as string,
    folio: a.folio as number,
    persona: perNombre.get(a.personal_id as string) ?? "—",
    fechaEntrega: a.fecha_entrega as string,
    estado: a.estado as string,
    firmada: Boolean(a.firmada),
    firmaData: (a.firma_data as string) ?? null,
    firmadaAt: (a.firmada_at as string) ?? null,
    observacion: (a.observacion as string) ?? null,
    items: itemsPorAsig.get(a.id as string) ?? [],
  }));

  const vigentes = asignaciones.filter((a) => a.estado === "vigente" || a.estado === "devuelto_parcial").length;
  const itemsPendientes = asignaciones.reduce(
    (acc, a) => acc + a.items.filter((i) => i.estado === "entregado").length,
    0,
  );

  return (
    <div>
      <PageHeader
        titulo="📋 Asignaciones"
        subtitulo="Entrega y devolución de EPP, uniformes y equipos a personal (actas de cargo)."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Actas" value={String(asignaciones.length)} />
          <Kpi label="Vigentes" value={String(vigentes)} tono={vigentes > 0 ? "blue" : "emerald"} />
          <Kpi label="Ítems sin devolver" value={String(itemsPendientes)} tono={itemsPendientes > 0 ? "amber" : "emerald"} />
          <Kpi label="Activos disponibles" value={String((act ?? []).length)} tono="slate" />
        </div>
      </PageHeader>
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="mb-4">
          <PageInfo seccion="asignaciones" />
        </div>
        <AsignacionesCliente
          asignaciones={asignaciones}
          personal={personal}
          ubicaciones={(ubi ?? []) as Pick<Ubicacion, "id" | "nombre">[]}
          articulos={articulosOpt}
          activos={(act ?? []) as Pick<Activo, "id" | "nombre" | "numero_serie" | "marca">[]}
        />
      </div>
    </div>
  );
}
