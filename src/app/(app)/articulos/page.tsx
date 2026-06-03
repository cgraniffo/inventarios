import { createClient } from "@/lib/supabase/server";
import type { Articulo, Ubicacion } from "@/lib/types";
import { calcularStock } from "@/lib/inventario/stock";
import { fCLP } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { PageInfo } from "@/components/page-info";
import { Kpi } from "@/components/kpi";
import { ArticulosCliente, type MovRow } from "./_cliente";

export const dynamic = "force-dynamic";

export default async function ArticulosPage() {
  const supabase = await createClient();
  const [{ data: arts }, { data: movs }, { data: ubi }] = await Promise.all([
    supabase.from("articulos").select("*").is("deleted_at", null).order("nombre"),
    supabase
      .from("inventario_movimientos")
      .select("id, articulo_id, tipo, cantidad, origen, fecha, valor_total, observacion, articulos(nombre, unidad)")
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("ubicaciones").select("id, nombre").is("deleted_at", null).order("nombre"),
  ]);

  const articulos = (arts ?? []) as Articulo[];
  const movsRaw = movs ?? [];

  const stock = calcularStock(
    articulos,
    movsRaw.map((m) => ({ articulo_id: m.articulo_id as string, cantidad: m.cantidad as number })),
  );

  const movimientos: MovRow[] = movsRaw.map((m) => {
    const a = Array.isArray(m.articulos) ? m.articulos[0] : m.articulos;
    return {
      id: m.id as string,
      articulo: (a as { nombre?: string } | null)?.nombre ?? "—",
      unidad: (a as { unidad?: string } | null)?.unidad ?? "",
      tipo: m.tipo as MovRow["tipo"],
      cantidad: Number(m.cantidad),
      origen: m.origen as string,
      fecha: m.fecha as string,
      valorTotal: m.valor_total != null ? Number(m.valor_total) : null,
      observacion: (m.observacion as string) ?? null,
    };
  });

  const valorTotal = stock.reduce((a, s) => a + s.valorizacion, 0);
  const bajoMin = stock.filter((s) => s.semaforo === "amarillo").length;
  const sinStock = stock.filter((s) => s.semaforo === "rojo").length;

  return (
    <div>
      <PageHeader titulo="📦 Artículos / EPP" subtitulo="Stock por cantidad: EPP, uniformes, consumibles y accesorios.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Artículos" value={String(stock.length)} />
          <Kpi label="Valorización" value={fCLP(valorTotal)} />
          <Kpi label="Bajo mínimo" value={String(bajoMin)} tono={bajoMin > 0 ? "amber" : "emerald"} />
          <Kpi label="Sin stock" value={String(sinStock)} tono={sinStock > 0 ? "rose" : "emerald"} />
        </div>
      </PageHeader>
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="mb-4">
          <PageInfo seccion="articulos" />
        </div>
        <ArticulosCliente
          stock={stock}
          movimientos={movimientos}
          ubicaciones={(ubi ?? []) as Pick<Ubicacion, "id" | "nombre">[]}
        />
      </div>
    </div>
  );
}
