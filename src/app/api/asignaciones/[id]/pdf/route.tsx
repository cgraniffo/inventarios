/**
 * GET /api/asignaciones/[id]/pdf
 *
 * Devuelve el PDF del acta de entrega renderizado con @react-pdf.
 */

import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { fDate } from "@/lib/format";
import { labelDe, ESTADOS_ASIGNACION } from "@/lib/constants";
import { ActaPDF, type ActaPDFItem } from "@/lib/pdf/acta-pdf";

type Params = Promise<{ id: string }>;

type Rel<T> = T | T[] | null;
const one = <T,>(v: Rel<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: asig } = await supabase
    .from("asignaciones")
    .select(
      `folio, fecha_entrega, estado, firmada, firma_data, observacion,
       persona:personal(nombre, rut, cargo),
       ubicacion:ubicaciones(nombre),
       items:asignacion_items(
         id, cantidad, talla, estado, fecha_devolucion,
         articulo:articulos(nombre, codigo, unidad, es_epp),
         activo:activos(nombre, marca, modelo, numero_serie)
       )`,
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!asig) return new NextResponse("Acta no encontrada", { status: 404 });

  const persona = one(asig.persona as Rel<{ nombre: string; rut: string | null; cargo: string | null }>);
  const ubicacion = one(asig.ubicacion as Rel<{ nombre: string }>);

  type ItemRow = {
    cantidad: number;
    talla: string | null;
    estado: string;
    articulo: Rel<{ nombre: string; codigo: string | null; unidad: string; es_epp: boolean }>;
    activo: Rel<{ nombre: string; marca: string | null; modelo: string | null; numero_serie: string | null }>;
  };

  const items: ActaPDFItem[] = ((asig.items as ItemRow[]) ?? []).map((it) => {
    const art = one(it.articulo);
    const act = one(it.activo);
    if (act) {
      return {
        tipo: "Activo serializado",
        descripcion: [act.nombre, act.marca, act.modelo].filter(Boolean).join(" · "),
        detalle: act.numero_serie ? `S/N ${act.numero_serie}` : "—",
        estado: it.estado,
      };
    }
    return {
      tipo: art?.es_epp ? "EPP" : "Artículo",
      descripcion: [art?.nombre, art?.codigo ? `(${art.codigo})` : null].filter(Boolean).join(" "),
      detalle: `${Number(it.cantidad)} ${art?.unidad ?? ""}${it.talla ? ` · Talla ${it.talla}` : ""}`.trim(),
      estado: it.estado,
    };
  });

  const buffer = await renderToBuffer(
    <ActaPDF
      folio={asig.folio as number}
      fechaEntrega={fDate(asig.fecha_entrega as string)}
      estado={labelDe(ESTADOS_ASIGNACION, asig.estado as string)}
      firmada={Boolean(asig.firmada)}
      observacion={(asig.observacion as string) ?? null}
      trabajador={persona?.nombre ?? "—"}
      rut={persona?.rut ?? null}
      cargo={persona?.cargo ?? null}
      puesto={ubicacion?.nombre ?? null}
      items={items}
      firmaData={(asig.firma_data as string) ?? null}
    />,
  );

  const filename = `acta_${String(asig.folio).padStart(4, "0")}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
