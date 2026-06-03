"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/format";

export type Result = { ok: boolean; error?: string };

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type ItemInput = {
  tipo: "articulo" | "activo";
  articulo_id?: string | null;
  activo_id?: string | null;
  cantidad?: number | string | null;
  talla?: string | null;
};

export type AsignacionInput = {
  personal_id: string;
  ubicacion_id?: string | null;
  fecha_entrega?: string | null;
  observacion?: string | null;
  items: ItemInput[];
};

/**
 * Crea un acta de entrega: inserta la asignación y sus ítems. Para cada artículo
 * descuenta stock (movimiento 'salida' origen 'asignacion'); para cada activo
 * serializado lo marca como 'asignado' a la persona.
 */
export async function crearAsignacionAction(input: AsignacionInput): Promise<Result> {
  try {
    const supabase = await createClient();
    if (!input.personal_id) return { ok: false, error: "Selecciona a la persona." };
    const items = (input.items ?? []).filter(
      (i) => (i.tipo === "articulo" && i.articulo_id) || (i.tipo === "activo" && i.activo_id),
    );
    if (items.length === 0) return { ok: false, error: "Agrega al menos un ítem a entregar." };

    const fecha = input.fecha_entrega || hoyISO();

    const { data: asig, error: e1 } = await supabase
      .from("asignaciones")
      .insert({
        personal_id: input.personal_id,
        ubicacion_id: input.ubicacion_id || null,
        fecha_entrega: fecha,
        estado: "vigente",
        observacion: input.observacion?.toString().trim() || null,
      })
      .select("id")
      .single();
    if (e1 || !asig) return { ok: false, error: e1?.message ?? "No se pudo crear la asignación." };
    const asignacionId = asig.id as string;

    // Insertar ítems
    const filasItems = items.map((i) => ({
      asignacion_id: asignacionId,
      articulo_id: i.tipo === "articulo" ? i.articulo_id : null,
      activo_id: i.tipo === "activo" ? i.activo_id : null,
      cantidad: i.tipo === "articulo" ? Math.abs(Number(i.cantidad) || 1) : 1,
      talla: i.talla?.toString().trim() || null,
      estado: "entregado",
    }));
    const { error: e2 } = await supabase.from("asignacion_items").insert(filasItems);
    if (e2) return { ok: false, error: e2.message };

    // Efectos colaterales
    for (const i of items) {
      if (i.tipo === "articulo" && i.articulo_id) {
        const cant = Math.abs(Number(i.cantidad) || 1);
        const { data: art } = await supabase
          .from("articulos")
          .select("precio_referencia")
          .eq("id", i.articulo_id)
          .maybeSingle();
        const precio = Number(art?.precio_referencia ?? 0);
        await supabase.from("inventario_movimientos").insert({
          articulo_id: i.articulo_id,
          tipo: "salida",
          cantidad: -cant,
          origen: "asignacion",
          fecha,
          asignacion_id: asignacionId,
          valor_unitario: precio || null,
          valor_total: precio ? cant * precio : null,
        });
      } else if (i.tipo === "activo" && i.activo_id) {
        await supabase
          .from("activos")
          .update({ estado: "asignado", asignado_a: input.personal_id })
          .eq("id", i.activo_id);
      }
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
  revalidatePath("/asignaciones");
  revalidatePath("/articulos");
  revalidatePath("/activos");
  return { ok: true };
}

/** Recalcula el estado de la asignación según sus ítems. */
async function recomputarEstado(supabase: Supabase, asignacionId: string) {
  const { data: items } = await supabase
    .from("asignacion_items")
    .select("estado")
    .eq("asignacion_id", asignacionId);
  const lista = items ?? [];
  const total = lista.length;
  const cerrados = lista.filter((i) => i.estado !== "entregado").length;
  let estado = "vigente";
  if (total > 0 && cerrados === total) estado = "devuelto";
  else if (cerrados > 0) estado = "devuelto_parcial";
  await supabase.from("asignaciones").update({ estado }).eq("id", asignacionId);
}

/**
 * Devuelve un ítem: si es artículo reingresa stock (entrada origen 'devolucion');
 * si es activo serializado lo libera (vuelve a 'operativo').
 */
export async function devolverItemAction(
  itemId: string,
  estadoDevolucion: "devuelto" | "perdido" | "dado_de_baja" = "devuelto",
): Promise<Result> {
  try {
    const supabase = await createClient();
    const { data: item } = await supabase
      .from("asignacion_items")
      .select("id, asignacion_id, articulo_id, activo_id, cantidad, estado")
      .eq("id", itemId)
      .maybeSingle();
    if (!item) return { ok: false, error: "Ítem no encontrado." };
    if (item.estado !== "entregado") return { ok: false, error: "El ítem ya fue cerrado." };

    if (item.articulo_id && estadoDevolucion === "devuelto") {
      const cant = Math.abs(Number(item.cantidad) || 1);
      const { data: art } = await supabase
        .from("articulos")
        .select("precio_referencia")
        .eq("id", item.articulo_id)
        .maybeSingle();
      const precio = Number(art?.precio_referencia ?? 0);
      await supabase.from("inventario_movimientos").insert({
        articulo_id: item.articulo_id,
        tipo: "entrada",
        cantidad: cant,
        origen: "devolucion",
        fecha: hoyISO(),
        asignacion_id: item.asignacion_id,
        valor_unitario: precio || null,
        valor_total: precio ? cant * precio : null,
      });
    }
    if (item.activo_id) {
      const nuevoEstado = estadoDevolucion === "dado_de_baja" ? "baja" : estadoDevolucion === "perdido" ? "extraviado" : "operativo";
      await supabase
        .from("activos")
        .update({ estado: nuevoEstado, asignado_a: null })
        .eq("id", item.activo_id);
    }

    await supabase
      .from("asignacion_items")
      .update({ estado: estadoDevolucion, fecha_devolucion: hoyISO() })
      .eq("id", itemId);

    await recomputarEstado(supabase, item.asignacion_id as string);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
  revalidatePath("/asignaciones");
  revalidatePath("/articulos");
  revalidatePath("/activos");
  return { ok: true };
}

export async function toggleFirmadaAction(id: string, firmada: boolean): Promise<Result> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("asignaciones").update({ firmada }).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
  revalidatePath("/asignaciones");
  return { ok: true };
}

/** Guarda la firma digital (PNG en data URL) y marca el acta como firmada. */
export async function firmarAsignacionAction(id: string, firmaData: string): Promise<Result> {
  try {
    if (!firmaData || !firmaData.startsWith("data:image/")) {
      return { ok: false, error: "La firma no es válida." };
    }
    if (firmaData.length > 600_000) {
      return { ok: false, error: "La firma es demasiado grande." };
    }
    const supabase = await createClient();
    const { error } = await supabase
      .from("asignaciones")
      .update({ firma_data: firmaData, firmada: true, firmada_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
  revalidatePath("/asignaciones");
  return { ok: true };
}

/** Quita la firma del acta (vuelve a no firmada). */
export async function quitarFirmaAction(id: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("asignaciones")
      .update({ firma_data: null, firmada: false, firmada_at: null })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
  revalidatePath("/asignaciones");
  return { ok: true };
}
