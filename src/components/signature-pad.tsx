"use client";

import { useRef, useState } from "react";

/**
 * Pad de firma sobre canvas (mouse o dedo). Devuelve la firma como PNG
 * (data URL) al guardar. No depende de librerías externas.
 */
export function SignaturePad({
  onSave,
  onCancel,
  pending,
}: {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  pending?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  function ctx() {
    const c = canvasRef.current;
    return c ? c.getContext("2d") : null;
  }

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * c.width,
      y: ((e.clientY - r.top) / r.height) * c.height,
    };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const g = ctx();
    if (!g) return;
    canvasRef.current!.setPointerCapture(e.pointerId);
    drawing.current = true;
    g.lineWidth = 2.5;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.strokeStyle = "#0f172a";
    const { x, y } = pos(e);
    g.beginPath();
    g.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const g = ctx();
    if (!g) return;
    const { x, y } = pos(e);
    g.lineTo(x, y);
    g.stroke();
    if (!hasDrawn) setHasDrawn(true);
  }

  function end() {
    drawing.current = false;
  }

  function limpiar() {
    const c = canvasRef.current;
    const g = ctx();
    if (c && g) g.clearRect(0, 0, c.width, c.height);
    setHasDrawn(false);
  }

  function guardar() {
    const c = canvasRef.current;
    if (!c || !hasDrawn) return;
    onSave(c.toDataURL("image/png"));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Firma con el dedo (en celular/tablet) o con el mouse dentro del recuadro.
      </p>
      <div className="rounded-lg border border-slate-300 bg-white">
        <canvas
          ref={canvasRef}
          width={500}
          height={180}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="h-[180px] w-full touch-none rounded-lg"
          style={{ touchAction: "none" }}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={limpiar}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          🧹 Limpiar
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={!hasDrawn || pending}
            className="rounded bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Guardar firma"}
          </button>
        </div>
      </div>
    </div>
  );
}
