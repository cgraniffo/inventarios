"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type Result = { ok: boolean; error?: string };

export type UbicacionInput = {
  id?: string;
  nombre: string;
  tipo: string;
  direccion?: string | null;
  responsable?: string | null;
  telefono?: string | null;
  observacion?: string | null;
  activo?: boolean;
};

export async function guardarUbicacionAction(input: UbicacionInput): Promise<Result> {
  try {
    const supabase = await createClient();
    const nombre = (input.nombre ?? "").trim();
    if (!nombre) return { ok: false, error: "El nombre es obligatorio." };

    const row = {
      nombre,
      tipo: input.tipo || "bodega",
      direccion: input.direccion?.toString().trim() || null,
      responsable: input.responsable?.toString().trim() || null,
      telefono: input.telefono?.toString().trim() || null,
      observacion: input.observacion?.toString().trim() || null,
      activo: input.activo ?? true,
    };

    if (input.id) {
      const { error } = await supabase.from("ubicaciones").update(row).eq("id", input.id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await supabase.from("ubicaciones").insert(row);
      if (error) return { ok: false, error: error.message };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
  revalidatePath("/ubicaciones");
  return { ok: true };
}

export async function eliminarUbicacionAction(id: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("ubicaciones")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
  revalidatePath("/ubicaciones");
  return { ok: true };
}
