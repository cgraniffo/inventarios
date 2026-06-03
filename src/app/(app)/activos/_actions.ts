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

export type ActivoInput = {
  id?: string;
  nombre: string;
  marca?: string | null;
  modelo?: string | null;
  numero_serie?: string | null;
  categoria: string;
  estado?: string;
  ubicacion_id?: string | null;
  asignado_a?: string | null;
  fecha_adquisicion?: string | null;
  valor?: number | string | null;
  vida_util_meses?: number | string | null;
  fecha_vencimiento?: string | null;
  observacion?: string | null;
};

export async function guardarActivoAction(input: ActivoInput): Promise<Result> {
  try {
    const supabase = await createClient();
    const nombre = (input.nombre ?? "").trim();
    if (!nombre) return { ok: false, error: "El nombre/descripción es obligatorio." };

    const row = {
      nombre,
      marca: input.marca?.toString().trim() || null,
      modelo: input.modelo?.toString().trim() || null,
      numero_serie: input.numero_serie?.toString().trim() || null,
      categoria: input.categoria || "comunicaciones",
      estado: input.estado || "operativo",
      ubicacion_id: input.ubicacion_id || null,
      asignado_a: input.asignado_a || null,
      fecha_adquisicion: input.fecha_adquisicion || null,
      valor: n(input.valor),
      vida_util_meses: n(input.vida_util_meses),
      fecha_vencimiento: input.fecha_vencimiento || null,
      observacion: input.observacion?.toString().trim() || null,
      activo: true,
    };

    if (input.id) {
      const { error } = await supabase.from("activos").update(row).eq("id", input.id);
      if (error) return { ok: false, error: traducirError(error.message) };
    } else {
      const { error } = await supabase.from("activos").insert(row);
      if (error) return { ok: false, error: traducirError(error.message) };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
  revalidatePath("/activos");
  return { ok: true };
}

function traducirError(msg: string): string {
  if (msg.includes("activos_numero_serie_uniq"))
    return "Ya existe un activo con ese número de serie.";
  return msg;
}

export async function cambiarEstadoActivoAction(
  id: string,
  estado: string,
): Promise<Result> {
  try {
    const supabase = await createClient();
    const update: Record<string, unknown> = { estado };
    // Si pasa a baja/operativo, se libera la asignación a persona.
    if (estado === "baja" || estado === "operativo") update.asignado_a = null;
    const { error } = await supabase.from("activos").update(update).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
  revalidatePath("/activos");
  return { ok: true };
}

export async function eliminarActivoAction(id: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("activos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
  revalidatePath("/activos");
  return { ok: true };
}

export async function crearMantencionAction(input: {
  activo_id: string;
  fecha: string;
  tipo: string;
  descripcion?: string | null;
  costo?: number | string | null;
  proveedor?: string | null;
  proximo_vencimiento?: string | null;
}): Promise<Result> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("mantenciones").insert({
      activo_id: input.activo_id,
      fecha: input.fecha || hoyISO(),
      tipo: input.tipo || "preventiva",
      descripcion: input.descripcion?.toString().trim() || null,
      costo: n(input.costo),
      proveedor: input.proveedor?.toString().trim() || null,
      proximo_vencimiento: input.proximo_vencimiento || null,
      estado: "realizada",
    });
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
  revalidatePath("/activos");
  return { ok: true };
}
