"use client";

import { useRef, useState } from "react";
import { Sparkles, Send, User } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGERENCIAS = [
  "¿Cuántos cascos talla L me quedan?",
  "¿Qué EPP está por vencer?",
  "¿Quién tiene la radio MOT-DEP450-00123?",
  "¿Cuánto vale el inventario en total?",
  "¿Qué activos están en reparación?",
  "¿Qué artículos están bajo el mínimo?",
];

export function AsistenteChat({ configurado }: { configurado: boolean }) {
  const [mensajes, setMensajes] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function enviar(texto: string) {
    const q = texto.trim();
    if (!q || cargando) return;
    setError(null);
    const nuevos: Msg[] = [...mensajes, { role: "user", content: q }];
    setMensajes(nuevos);
    setInput("");
    setCargando(true);
    try {
      const resp = await fetch("/api/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensajes: nuevos }),
      });
      const data = await resp.json();
      if (data.ok) {
        setMensajes((m) => [...m, { role: "assistant", content: data.texto }]);
      } else {
        setError(data.error ?? "No se pudo obtener respuesta.");
      }
    } catch {
      setError("Error de conexión con el asistente.");
    } finally {
      setCargando(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[420px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      {!configurado && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          ⚠️ La IA no está configurada. Agrega <code className="rounded bg-white px-1">ANTHROPIC_API_KEY</code> en
          <code className="rounded bg-white px-1">.env.local</code> y reinicia el servidor para activarla.
        </div>
      )}

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {mensajes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800">Hola, soy Sr. Bodega 👋</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Pregúntame lo que quieras sobre tu inventario. Algunas ideas:
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => enviar(s)}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-violet-300 hover:bg-violet-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          mensajes.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                  <Sparkles className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-sm bg-emerald-600 text-white"
                    : "rounded-bl-sm bg-slate-100 text-slate-800"
                }`}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))
        )}

        {cargando && (
          <div className="flex gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-3.5 py-2 text-sm text-slate-500">
              Pensando…
            </div>
          </div>
        )}
      </div>

      {error && <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-800">{error}</div>}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(input);
        }}
        className="flex items-center gap-2 border-t border-slate-200 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta…"
          disabled={cargando}
          className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
        />
        <button
          type="submit"
          disabled={cargando || !input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40"
          aria-label="Enviar"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
