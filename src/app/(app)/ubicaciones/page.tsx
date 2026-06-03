import { createClient } from "@/lib/supabase/server";
import type { Ubicacion } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { PageInfo } from "@/components/page-info";
import { UbicacionesCliente } from "./_cliente";

export const dynamic = "force-dynamic";

export default async function UbicacionesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ubicaciones")
    .select("*")
    .is("deleted_at", null)
    .order("nombre");

  const ubicaciones = (data ?? []) as Ubicacion[];

  return (
    <div>
      <PageHeader
        titulo="📍 Ubicaciones"
        subtitulo="Bodegas, puestos de servicio e instalaciones donde se almacena el material."
      />
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <div className="mb-4">
          <PageInfo seccion="ubicaciones" />
        </div>
        <UbicacionesCliente ubicaciones={ubicaciones} />
      </div>
    </div>
  );
}
