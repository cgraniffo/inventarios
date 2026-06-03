import { createClient } from "@/lib/supabase/server";
import { calcularStock } from "@/lib/inventario/stock";
import type { Activo, Articulo } from "@/lib/types";

/**
 * Arma un snapshot compacto (JSON) del inventario para dárselo a la IA como
 * contexto. Incluye stock calculado, activos con su estado, personal,
 * ubicaciones y asignaciones con sus ítems.
 */
export async function construirContexto(): Promise<string> {
  const supabase = await createClient();
  const [{ data: arts }, { data: movs }, { data: act }, { data: per }, { data: ubi }, { data: asigs }, { data: items }] =
    await Promise.all([
      supabase.from("articulos").select("*").is("deleted_at", null),
      supabase.from("inventario_movimientos").select("articulo_id, cantidad"),
      supabase.from("activos").select("*").is("deleted_at", null),
      supabase.from("personal").select("id, nombre, cargo").is("deleted_at", null),
      supabase.from("ubicaciones").select("id, nombre, tipo").is("deleted_at", null),
      supabase.from("asignaciones").select("id, folio, personal_id, estado, fecha_entrega, firmada").is("deleted_at", null),
      supabase.from("asignacion_items").select("asignacion_id, articulo_id, activo_id, cantidad, talla, estado, articulos(nombre), activos(nombre, numero_serie)"),
    ]);

  const perNombre = new Map((per ?? []).map((p) => [p.id, p.nombre as string]));
  const ubiNombre = new Map((ubi ?? []).map((u) => [u.id, u.nombre as string]));

  const stock = calcularStock(
    (arts ?? []) as Articulo[],
    (movs ?? []).map((m) => ({ articulo_id: m.articulo_id as string, cantidad: m.cantidad as number })),
  );

  const articulos = stock.map((s) => ({
    nombre: s.nombre,
    categoria: s.categoria,
    talla: s.talla ?? undefined,
    unidad: s.unidad,
    es_epp: s.es_epp || undefined,
    stock: s.stockActual,
    minimo: s.stock_minimo,
    estado: s.semaforo,
    precio: s.precio_referencia,
    vida_util_meses: s.vida_util_meses ?? undefined,
  }));

  const activos = ((act ?? []) as Activo[]).map((a) => ({
    nombre: a.nombre,
    marca: a.marca ?? undefined,
    modelo: a.modelo ?? undefined,
    numero_serie: a.numero_serie ?? undefined,
    categoria: a.categoria,
    estado: a.estado,
    asignado_a: a.asignado_a ? perNombre.get(a.asignado_a) ?? undefined : undefined,
    ubicacion: a.ubicacion_id ? ubiNombre.get(a.ubicacion_id) ?? undefined : undefined,
    vence: a.fecha_vencimiento ?? undefined,
  }));

  const itemsPorAsig = new Map<string, string[]>();
  for (const it of items ?? []) {
    const ar = Array.isArray(it.articulos) ? it.articulos[0] : it.articulos;
    const av = Array.isArray(it.activos) ? it.activos[0] : it.activos;
    const nombre = (ar as { nombre?: string } | null)?.nombre
      ?? (av as { nombre?: string } | null)?.nombre
      ?? "ítem";
    const serie = (av as { numero_serie?: string } | null)?.numero_serie;
    const desc = `${nombre}${serie ? ` (S/N ${serie})` : ""} x${Number(it.cantidad)}${it.talla ? ` talla ${it.talla}` : ""} [${it.estado}]`;
    const arr = itemsPorAsig.get(it.asignacion_id as string) ?? [];
    arr.push(desc);
    itemsPorAsig.set(it.asignacion_id as string, arr);
  }

  const asignaciones = (asigs ?? []).map((a) => ({
    folio: a.folio,
    persona: perNombre.get(a.personal_id as string) ?? "—",
    estado: a.estado,
    fecha: a.fecha_entrega,
    firmada: a.firmada,
    items: itemsPorAsig.get(a.id as string) ?? [],
  }));

  const ubicaciones = (ubi ?? []).map((u) => ({ nombre: u.nombre, tipo: u.tipo }));
  const personal = (per ?? []).map((p) => ({ nombre: p.nombre, cargo: p.cargo ?? undefined }));

  return JSON.stringify({ articulos, activos, personal, ubicaciones, asignaciones });
}
