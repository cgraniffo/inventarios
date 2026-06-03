import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { PageInfo } from "@/components/page-info";
import { MovimientosCliente, type MovFull } from "./_cliente";

export const dynamic = "force-dynamic";

export default async function MovimientosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventario_movimientos")
    .select("id, tipo, cantidad, origen, fecha, valor_total, observacion, articulos(nombre, unidad)")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  const movimientos: MovFull[] = (data ?? []).map((m) => {
    const a = Array.isArray(m.articulos) ? m.articulos[0] : m.articulos;
    return {
      id: m.id as string,
      articulo: (a as { nombre?: string } | null)?.nombre ?? "—",
      unidad: (a as { unidad?: string } | null)?.unidad ?? "",
      tipo: m.tipo as MovFull["tipo"],
      cantidad: Number(m.cantidad),
      origen: m.origen as string,
      fecha: m.fecha as string,
      valorTotal: m.valor_total != null ? Number(m.valor_total) : null,
      observacion: (m.observacion as string) ?? null,
    };
  });

  return (
    <div>
      <PageHeader
        titulo="🔁 Movimientos"
        subtitulo="Historial consolidado de entradas, salidas y ajustes de artículos. (Para crear uno: pestaña Stock en Artículos.)"
      />
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="mb-4">
          <PageInfo seccion="movimientos" />
        </div>
        <MovimientosCliente movimientos={movimientos} />
      </div>
    </div>
  );
}
