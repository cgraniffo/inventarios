"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/format";

export type Result = { ok: boolean; error?: string };

const n = (v: unknown): number | null => {
  if (v === "" || v === null || v === undefined) return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
};

export type ArticuloInput = {
  id?: string;
  nombre: string;
  codigo?: string | null;
  categoria: string;
  unidad: string;
  es_epp?: boolean;
  talla?: string | null;
  norma_certificacion?: string | null;
  vida_util_meses?: number | string | null;
  requiere_devolucion?: boolean;
  stock_inicial?: number | string | null;
  fecha_stock_inicial?: string | null;
  stock_minimo?: number | string | null;
  umbral_rojo?: number | string | null;
  umbral_amarillo?: number | string | null;
  precio_referencia?: number | string | null;
  ubicacion_id?: string | null;
  observacion?: string | null;
};

export async function guardarArticuloAction(input: ArticuloInput): Promise<Result> {
  try {
    const supabase = await createClient();
    const nombre = (input.nombre ?? "").trim();
    if (!nombre) return { ok: false, error: "El nombre es obligatorio." };
    const esEpp = Boolean(input.es_epp) || input.categoria === "epp";

    const row = {
      nombre,
      codigo: input.codigo?.toString().trim() || null,
      categoria: input.categoria || "consumible",
      unidad: input.unidad || "un",
      es_epp: esEpp,
      talla: input.talla?.toString().trim() || null,
      norma_certificacion: input.norma_certificacion?.toString().trim() || null,
      vida_util_meses: n(input.vida_util_meses),
      requiere_devolucion: Boolean(input.requiere_devolucion),
      stock_inicial: n(input.stock_inicial) ?? 0,
      fecha_stock_inicial: input.fecha_stock_inicial || null,
      stock_minimo: n(input.stock_minimo) ?? 0,
      umbral_rojo: n(input.umbral_rojo),
      umbral_amarillo: n(input.umbral_amarillo),
      precio_referencia: n(input.precio_referencia) ?? 0,
      ubicacion_id: input.ubicacion_id || null,
      observacion: input.observacion?.toString().trim() || null,
      activo: true,
    };

    if (input.id) {
      const { error } = await supabase.from("articulos").update(row).eq("id", input.id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await supabase.from("articulos").insert(row);
      if (error) return { ok: false, error: error.message };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
  revalidatePath("/articulos");
  return { ok: true };
}

export async function eliminarArticuloAction(id: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("articulos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
  revalidatePath("/articulos");
  return { ok: true };
}

/** Movimiento manual de entrada o salida. */
export async function crearMovimientoAction(input: {
  articulo_id: string;
  tipo: "entrada" | "salida";
  cantidad: number;
  fecha?: string | null;
  observacion?: string | null;
}): Promise<Result> {
  try {
    const supabase = await createClient();
    const abs = Math.abs(Number(input.cantidad) || 0);
    if (abs <= 0) return { ok: false, error: "La cantidad debe ser mayor a 0." };
    const cantidad = input.tipo === "salida" ? -abs : abs;

    const { data: art } = await supabase
      .from("articulos")
      .select("precio_referencia")
      .eq("id", input.articulo_id)
      .maybeSingle();
    if (!art) return { ok: false, error: "Artículo no encontrado." };
    const precio = Number(art.precio_referencia ?? 0);

    const { error } = await supabase.from("inventario_movimientos").insert({
      articulo_id: input.articulo_id,
      tipo: input.tipo,
      cantidad,
      origen: "manual",
      fecha: input.fecha || hoyISO(),
      valor_unitario: precio || null,
      valor_total: precio ? abs * precio : null,
      observacion: input.observacion?.trim() || null,
    });
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
  revalidatePath("/articulos");
  revalidatePath("/movimientos");
  return { ok: true };
}

/**
 * Ajuste por conteo físico: registra un movimiento 'ajuste' con la diferencia
 * entre el stock real (contado) y el stock actual calculado.
 */
export async function ajustarStockAction(
  articuloId: string,
  stockReal: number,
  observacion: string,
): Promise<Result> {
  try {
    const supabase = await createClient();
    const { data: art } = await supabase
      .from("articulos")
      .select("stock_inicial, precio_referencia")
      .eq("id", articuloId)
      .maybeSingle();
    if (!art) return { ok: false, error: "Artículo no encontrado." };

    const { data: movs } = await supabase
      .from("inventario_movimientos")
      .select("cantidad")
      .eq("articulo_id", articuloId);
    const sumado = (movs ?? []).reduce((a, m) => a + Number(m.cantidad), 0);
    const actual = Number(art.stock_inicial ?? 0) + sumado;
    const delta = stockReal - actual;
    if (Math.abs(delta) < 1e-9)
      return { ok: false, error: "El stock real es igual al actual: nada que ajustar." };

    const precio = Number(art.precio_referencia ?? 0);
    const { error } = await supabase.from("inventario_movimientos").insert({
      articulo_id: articuloId,
      tipo: "ajuste",
      cantidad: delta,
      origen: "ajuste",
      fecha: hoyISO(),
      valor_unitario: precio || null,
      valor_total: precio ? Math.abs(delta) * precio : null,
      observacion: observacion?.trim() || null,
    });
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
  revalidatePath("/articulos");
  revalidatePath("/movimientos");
  return { ok: true };
}
