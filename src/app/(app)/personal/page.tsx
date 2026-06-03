import { createClient } from "@/lib/supabase/server";
import type { Personal, Ubicacion } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { PageInfo } from "@/components/page-info";
import { PersonalCliente } from "./_cliente";

export const dynamic = "force-dynamic";

export default async function PersonalPage() {
  const supabase = await createClient();
  const [{ data: per }, { data: ubi }] = await Promise.all([
    supabase.from("personal").select("*").is("deleted_at", null).order("nombre"),
    supabase.from("ubicaciones").select("id, nombre").is("deleted_at", null).order("nombre"),
  ]);

  return (
    <div>
      <PageHeader
        titulo="👮 Personal"
        subtitulo="Guardias y operativos a quienes se entrega EPP, uniformes y equipos."
      />
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="mb-4">
          <PageInfo seccion="personal" />
        </div>
        <PersonalCliente
          personal={(per ?? []) as Personal[]}
          ubicaciones={(ubi ?? []) as Pick<Ubicacion, "id" | "nombre">[]}
        />
      </div>
    </div>
  );
}
