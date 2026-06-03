import Anthropic from "@anthropic-ai/sdk";

// Haiku 4.5: rápido y económico, suficiente para consultas de inventario.
const MODELO = "claude-haiku-4-5-20251001";

export function claudeConfigurado(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export type Mensaje = { role: "user" | "assistant"; content: string };

type Resultado = { ok: true; texto: string } | { ok: false; error: string };

/**
 * Responde una conversación del asistente. El `contexto` (snapshot del
 * inventario) va como bloque con prompt caching: en una conversación de varios
 * turnos no se reprocesa cada vez.
 */
export async function responderAsistente({
  system,
  contexto,
  mensajes,
}: {
  system: string;
  contexto: string;
  mensajes: Mensaje[];
}): Promise<Resultado> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "La IA no está configurada (falta ANTHROPIC_API_KEY)." };
  }
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const resp = await client.messages.create({
      model: MODELO,
      max_tokens: 1024,
      system: [
        { type: "text", text: system },
        { type: "text", text: contexto, cache_control: { type: "ephemeral" } },
      ],
      messages: mensajes.map((m) => ({ role: m.role, content: m.content })),
    });
    const texto = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return { ok: true, texto: texto || "No tengo una respuesta para eso." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al consultar la IA." };
  }
}
