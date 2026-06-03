import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Activo, Articulo } from "@/lib/types";
import { calcularStock } from "@/lib/inventario/stock";
import { fCLP } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Kpi } from "@/components/kpi";
import { PageInfo } from "@/components/page-info";
import {
  Package,
  Radio,
  ClipboardList,
  Users,
  MapPin,
  Bell,
  ArrowLeftRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

const CONFIGURADO = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const MODULOS = [
  { href: "/articulos", label: "Artículos / EPP", desc: "Stock, tallas y vida útil", icon: Package },
  { href: "/activos", label: "Activos serializados", desc: "Radios y equipos por N° de serie", icon: Radio },
  { href: "/asignaciones", label: "Asignaciones", desc: "Entrega y devolución a personal", icon: ClipboardList },
  { href: "/movimientos", label: "Movimientos", desc: "Entradas, salidas y ajustes", icon: ArrowLeftRight },
  { href: "/personal", label: "Personal", desc: "Guardias y operativos", icon: Users },
  { href: "/ubicaciones", label: "Ubicaciones", desc: "Bodegas y puestos de servicio", icon: MapPin },
  { href: "/alertas", label: "Alertas", desc: "Vencimientos y stock crítico", icon: Bell },
];

export default async function Home() {
  if (!CONFIGURADO) return <SetupPendiente />;

  const supabase = await createClient();
  const [{ data: arts }, { data: movs }, { data: act }, { data: asigs }] = await Promise.all([
    supabase.from("articulos").select("*").is("deleted_at", null),
    supabase.from("inventario_movimientos").select("articulo_id, cantidad"),
    supabase.from("activos").select("id, estado, valor").is("deleted_at", null),
    supabase.from("asignaciones").select("estado").is("deleted_at", null),
  ]);

  const stock = calcularStock(
    (arts ?? []) as Articulo[],
    (movs ?? []).map((m) => ({ articulo_id: m.articulo_id as string, cantidad: m.cantidad as number })),
  );
  const valor = stock.reduce((a, s) => a + s.valorizacion, 0);
  const sinStock = stock.filter((s) => s.semaforo === "rojo").length;
  const bajoMin = stock.filter((s) => s.semaforo === "amarillo").length;

  const activos = (act ?? []) as Pick<Activo, "id" | "estado" | "valor">[];
  const enRep = activos.filter((a) => a.estado === "en_reparacion").length;
  const asignados = activos.filter((a) => a.estado === "asignado").length;
  const vigentes = (asigs ?? []).filter((a) => a.estado === "vigente" || a.estado === "devuelto_parcial").length;

  return (
    <div>
      <PageHeader titulo="🛡️ Inventario de Seguridad" subtitulo="Panel general de stock, activos y asignaciones.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Kpi label="Artículos" value={String(stock.length)} />
          <Kpi label="Valorización" value={fCLP(valor)} />
          <Kpi label="Sin stock" value={String(sinStock)} tono={sinStock > 0 ? "rose" : "emerald"} />
          <Kpi label="Bajo mínimo" value={String(bajoMin)} tono={bajoMin > 0 ? "amber" : "emerald"} />
          <Kpi label="Activos asignados" value={String(asignados)} tono="blue" />
          <Kpi label="En reparación" value={String(enRep)} tono={enRep > 0 ? "amber" : "emerald"} />
        </div>
      </PageHeader>

      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="mb-5">
          <PageInfo seccion="dashboard" />
        </div>
        {vigentes > 0 && (
          <Link href="/asignaciones" className="mb-5 block rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 hover:bg-blue-100">
            📋 Tienes <strong>{vigentes}</strong> acta(s) de asignación vigente(s) con material por devolver.
          </Link>
        )}

        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Módulos</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULOS.map(({ href, label, desc, icon: Icon }) => (
            <Link key={href} href={href}
              className="group flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 hover:border-emerald-300 hover:shadow-sm">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 group-hover:bg-emerald-100">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{label}</p>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function SetupPendiente() {
  return (
    <div className="mx-auto max-w-2xl p-6 sm:p-10">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-xl font-bold text-amber-900">⚙️ Falta conectar Supabase</h1>
        <p className="mt-2 text-sm text-amber-800">
          La app está lista, pero todavía no tiene las claves de la base de datos. Para activarla:
        </p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-amber-800">
          <li>Copia <code className="rounded bg-white px-1">.env.local.example</code> como <code className="rounded bg-white px-1">.env.local</code>.</li>
          <li>Pega tu <code className="rounded bg-white px-1">NEXT_PUBLIC_SUPABASE_URL</code> y <code className="rounded bg-white px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.</li>
          <li>Aplica el schema <code className="rounded bg-white px-1">supabase/migrations/0001_init.sql</code> en tu proyecto.</li>
          <li>Reinicia <code className="rounded bg-white px-1">pnpm dev</code>.</li>
        </ol>
      </div>
    </div>
  );
}
