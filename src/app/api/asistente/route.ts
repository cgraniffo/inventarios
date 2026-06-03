import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { construirContexto } from "@/lib/ai/contexto";
import { responderAsistente, claudeConfigurado, type Mensaje } from "@/lib/ai/claude";

const SYSTEM = `Eres "Sr. Bodega", el asistente de inventario de una empresa de seguridad (Empresa Demo).
Respondes preguntas sobre el inventario usando EXCLUSIVAMENTE los datos del CONTEXTO (un JSON con
articulos, activos, personal, ubicaciones y asignaciones).

Reglas:
- Español neutro chileno, claro y conciso. Trata de "tú".
- Usa solo los datos del contexto. Si algo no está, dilo claramente; NO inventes.
- Puedes hacer cálculos (sumar stock, contar, valorizar = stock × precio, etc.).
- Cuando ayude, responde con listas cortas o tablas simples en texto.
- "estado" de un articulo: rojo = sin/crítico, amarillo = bajo el mínimo, verde = ok.
- Sé breve y útil. No repitas todo el inventario salvo que lo pidan.`;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  if (!claudeConfigurado()) {
    return NextResponse.json({
      ok: false,
      error: "La IA no está configurada todavía. Agrega ANTHROPIC_API_KEY en .env.local y reinicia el servidor.",
    });
  }

  let mensajes: Mensaje[] = [];
  try {
    const body = await req.json();
    mensajes = Array.isArray(body?.mensajes) ? body.mensajes : [];
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }
  mensajes = mensajes
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12);
  if (mensajes.length === 0) {
    return NextResponse.json({ ok: false, error: "No hay mensaje que responder." }, { status: 400 });
  }

  const contexto = await construirContexto();
  const r = await responderAsistente({ system: SYSTEM, contexto, mensajes });
  return NextResponse.json(r);
}
