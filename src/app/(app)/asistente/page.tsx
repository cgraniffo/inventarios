import { PageHeader } from "@/components/page-header";
import { PageInfo } from "@/components/page-info";
import { claudeConfigurado } from "@/lib/ai/claude";
import { AsistenteChat } from "./_chat";

export const dynamic = "force-dynamic";

export default function AsistentePage() {
  return (
    <div>
      <PageHeader
        titulo="✨ Asistente de inventario"
        subtitulo="Pregúntale a la IA sobre tu stock, EPP, activos y asignaciones en lenguaje natural."
      />
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="mb-4">
          <PageInfo seccion="asistente" />
        </div>
        <AsistenteChat configurado={claudeConfigurado()} />
      </div>
    </div>
  );
}
