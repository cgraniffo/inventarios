"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type Result = { ok: boolean; error?: string };

export type PersonalInput = {
  id?: string;
  nombre: string;
  rut?: string | null;
  cargo?: string | null;
  ubicacion_id?: string | null;
  telefono?: string | null;
  email?: string | null;
  fecha_ingreso?: string | null;
  observacion?: string | null;
};

export async function guardarPersonalAction(input: PersonalInput): Promise<Result> {
  try {
    const supabase = await createClient();
    const nombre = (input.nombre ?? "").trim();
    if (!nombre) return { ok: false, error: "El nombre es obligatorio." };

    const row = {
      nombre,
      rut: input.rut?.toString().trim() || null,
      cargo: input.cargo?.toString().trim() || null,
      ubicacion_id: input.ubicacion_id || null,
      telefono: input.telefono?.toString().trim() || null,
      email: input.email?.toString().trim() || null,
      fecha_ingreso: input.fecha_ingreso || null,
      observacion: input.observacion?.toString().trim() || null,
    };

    if (input.id) {
      const { error } = await supabase.from("personal").update(row).eq("id", input.id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await supabase.from("personal").insert(row);
      if (error) return { ok: false, error: error.message };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
  revalidatePath("/personal");
  return { ok: true };
}

export async function eliminarPersonalAction(id: string): Promise<Result> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("personal")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
  revalidatePath("/personal");
  return { ok: true };
}
