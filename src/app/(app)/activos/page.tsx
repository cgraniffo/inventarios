import { createClient } from "@/lib/supabase/server";
import type { Activo, Mantencion, Personal, Ubicacion } from "@/lib/types";
import { fCLP } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { PageInfo } from "@/components/page-info";
import { Kpi } from "@/components/kpi";
import { ActivosCliente } from "./_cliente";

export const dynamic = "force-dynamic";

export default async function ActivosPage() {
  const supabase = await createClient();
  const [{ data: act }, { data: ubi }, { data: per }, { data: mant }] = await Promise.all([
    supabase.from("activos").select("*").is("deleted_at", null).order("nombre"),
    supabase.from("ubicaciones").select("id, nombre").is("deleted_at", null).order("nombre"),
    supabase.from("personal").select("id, nombre").is("deleted_at", null).order("nombre"),
    supabase.from("mantenciones").select("*").order("fecha", { ascending: false }),
  ]);

  const activos = (act ?? []) as Activo[];
  const valorTotal = activos.reduce((a, x) => a + Number(x.valor ?? 0), 0);
  const enReparacion = activos.filter((x) => x.estado === "en_reparacion").length;
  const asignados = activos.filter((x) => x.estado === "asignado").length;

  return (
    <div>
      <PageHeader
        titulo="📻 Activos serializados"
        subtitulo="Radios, equipos y bienes con número de serie: estado, ubicación y mantención por unidad."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Activos" value={String(activos.length)} />
          <Kpi label="Valor total" value={fCLP(valorTotal)} />
          <Kpi label="Asignados" value={String(asignados)} tono="blue" />
          <Kpi label="En reparación" value={String(enReparacion)} tono={enReparacion > 0 ? "amber" : "emerald"} />
        </div>
      </PageHeader>
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="mb-4">
          <PageInfo seccion="activos" />
        </div>
        <ActivosCliente
          activos={activos}
          ubicaciones={(ubi ?? []) as Pick<Ubicacion, "id" | "nombre">[]}
          personal={(per ?? []) as Pick<Personal, "id" | "nombre">[]}
          mantenciones={(mant ?? []) as Mantencion[]}
        />
      </div>
    </div>
  );
}
