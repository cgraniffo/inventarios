"use client";

import { useState, type ReactNode } from "react";
import { Info, ChevronDown } from "lucide-react";

/** Caja de ayuda colapsable. El contenido por sección vive en CONTENIDO. */
function InfoToggle({ titulo, children }: { titulo: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
          <Info className="h-4 w-4 text-emerald-600" />
          {titulo}
        </span>
        <ChevronDown className={`h-4 w-4 text-emerald-700 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-2 border-t border-emerald-100 px-4 py-3 text-sm leading-relaxed text-slate-700">
          {children}
        </div>
      )}
    </div>
  );
}

function Li({ children }: { children: ReactNode }) {
  return <li className="ml-4 list-disc">{children}</li>;
}

type Seccion =
  | "dashboard"
  | "articulos"
  | "activos"
  | "asignaciones"
  | "asistente"
  | "movimientos"
  | "personal"
  | "ubicaciones"
  | "alertas";

const CONTENIDO: Record<Seccion, { titulo: string; cuerpo: ReactNode }> = {
  dashboard: {
    titulo: "¿Qué muestra el panel?",
    cuerpo: (
      <>
        <p>Vista general del inventario con los indicadores clave y accesos a cada módulo.</p>
        <ul className="space-y-1">
          <Li><strong>Artículos</strong>: total de ítems controlados por cantidad.</Li>
          <Li><strong>Valorización</strong>: valor del stock = cantidad × precio unitario de cada artículo.</Li>
          <Li><strong>Sin stock / Bajo mínimo</strong>: cuántos artículos están en rojo o amarillo según el semáforo.</Li>
          <Li><strong>Activos asignados / En reparación</strong>: estado de los bienes serializados (radios, equipos).</Li>
          <Li>Si hay actas de entrega vigentes con material por devolver, aparece un aviso azul.</Li>
        </ul>
      </>
    ),
  },
  articulos: {
    titulo: "¿Cómo funciona Artículos / EPP?",
    cuerpo: (
      <>
        <p>Maneja todo lo que se controla <strong>por cantidad</strong>: EPP, uniformes, consumibles y accesorios. Tiene 3 pestañas:</p>
        <ul className="space-y-1">
          <Li><strong>Stock actual</strong>: cada artículo con su semáforo 🟢🟡🔴, stock, mínimo, precio y valorización. Botón <em>+ Movimiento</em> para una entrada/salida, y <em>⚖️ Ajustar</em> para corregir según un conteo físico.</Li>
          <Li><strong>Movimientos</strong>: historial de entradas (+), salidas (−) y ajustes del artículo.</Li>
          <Li><strong>Maestro</strong>: crear/editar artículos. Marca la casilla <strong>“Es EPP”</strong> para habilitar talla, norma/certificación, vida útil y “requiere devolución”.</Li>
        </ul>
        <p><strong>Semáforo:</strong> 🟢 sobre el mínimo · 🟡 igual o bajo el mínimo · 🔴 sin stock o crítico. Puedes fijar umbrales propios por artículo.</p>
      </>
    ),
  },
  activos: {
    titulo: "¿Cómo funciona Activos serializados?",
    cuerpo: (
      <>
        <p>Para bienes <strong>únicos e identificables por N° de serie</strong>: radios, equipos, vehículos, etc. Cada unidad se sigue por separado.</p>
        <ul className="space-y-1">
          <Li><strong>Estado</strong>: operativo, asignado, en reparación, dado de baja o extraviado.</Li>
          <Li><strong>Ubicación / asignado</strong>: dónde está o a qué persona está entregado.</Li>
          <Li><strong>Cert./venc.</strong>: fecha de vencimiento de certificación, garantía o revisión técnica (se resalta si está por vencer o vencida).</Li>
          <Li>Botón <strong>🔧</strong>: registra una mantención (preventiva, correctiva, inspección, calibración), ve el historial por unidad y cambia el estado.</Li>
        </ul>
      </>
    ),
  },
  asignaciones: {
    titulo: "¿Cómo funcionan las Asignaciones (actas)?",
    cuerpo: (
      <>
        <p>Un <strong>acta de entrega</strong> registra el material entregado a una persona (cargo).</p>
        <ul className="space-y-1">
          <Li>Al entregar un <strong>artículo</strong> se descuenta su stock; al entregar un <strong>activo serializado</strong> queda marcado como “asignado” a esa persona.</Li>
          <Li><strong>Devolver</strong> un artículo reingresa el stock; devolver un activo lo deja operativo. <strong>“Perdido”</strong> no reingresa stock y marca el activo como extraviado.</Li>
          <Li>El acta tiene estado: <em>vigente</em>, <em>devuelto parcial</em> o <em>devuelto</em>.</Li>
          <Li><strong>✍️ Firmar acta</strong>: el trabajador firma en pantalla (dedo o mouse); la firma queda guardada y se incrusta en el PDF.</Li>
          <Li>Botón <strong>📄 PDF</strong>: genera el acta lista para imprimir o firmar a mano.</Li>
        </ul>
      </>
    ),
  },
  asistente: {
    titulo: "¿Cómo funciona el Asistente IA?",
    cuerpo: (
      <>
        <p>Un chat para consultar tu inventario en lenguaje natural, impulsado por IA (Claude).</p>
        <ul className="space-y-1">
          <Li>Responde usando <strong>solo tus datos reales</strong> (stock, EPP, activos, asignaciones); no inventa.</Li>
          <Li>Ejemplos: <em>“¿cuántos cascos talla L quedan?”</em>, <em>“¿quién tiene la radio MOT-DEP450-00123?”</em>, <em>“¿cuánto vale el inventario?”</em>.</Li>
          <Li>Puede sumar, contar y valorizar. Usa los chips de sugerencias para partir.</Li>
          <Li>Requiere la clave <code className="rounded bg-slate-100 px-1">ANTHROPIC_API_KEY</code> configurada (si falta, avisa).</Li>
        </ul>
      </>
    ),
  },
  movimientos: {
    titulo: "¿Qué son los Movimientos?",
    cuerpo: (
      <>
        <p>Historial consolidado de todos los movimientos de artículos por cantidad.</p>
        <ul className="space-y-1">
          <Li><strong>Entrada (+)</strong>: ingresa stock (compra, devolución, ingreso manual).</Li>
          <Li><strong>Salida (−)</strong>: descuenta stock (consumo, entrega en un acta, baja).</Li>
          <Li><strong>Ajuste</strong>: corrige el stock a un valor real (conteo físico, merma).</Li>
          <Li>El <strong>origen</strong> indica de dónde viene el movimiento (manual, asignación, devolución, etc.). Para crear uno a mano: pestaña <em>Stock</em> en Artículos.</Li>
        </ul>
      </>
    ),
  },
  personal: {
    titulo: "¿Para qué sirve Personal?",
    cuerpo: (
      <>
        <p>Registro de guardias y operativos a quienes se entrega material.</p>
        <ul className="space-y-1">
          <Li>Cada persona puede tener cargo, RUT, teléfono y un puesto/ubicación asignado.</Li>
          <Li>Se usan al crear una <strong>asignación</strong> y al asignar un <strong>activo</strong> serializado.</Li>
        </ul>
      </>
    ),
  },
  ubicaciones: {
    titulo: "¿Para qué sirven las Ubicaciones?",
    cuerpo: (
      <>
        <p>Los lugares físicos donde se almacena o usa el material.</p>
        <ul className="space-y-1">
          <Li><strong>Bodega central / bodega</strong>: almacenamiento.</Li>
          <Li><strong>Puesto de servicio / instalación</strong>: donde opera el personal.</Li>
          <Li>Se asocian a personal, artículos y activos para saber dónde está cada cosa.</Li>
        </ul>
      </>
    ),
  },
  alertas: {
    titulo: "¿Qué muestran las Alertas?",
    cuerpo: (
      <>
        <p>Resumen de todo lo que requiere atención, agrupado por tipo. Cada sección enlaza a su módulo.</p>
        <ul className="space-y-1">
          <Li><strong>Stock bajo o sin stock</strong>: artículos en amarillo o rojo.</Li>
          <Li><strong>EPP por vencer</strong>: vida útil próxima a cumplirse (fecha del conteo + meses de vida útil).</Li>
          <Li><strong>Certificación de activos</strong>: garantías/certificaciones por vencer o vencidas.</Li>
          <Li><strong>En reparación / extraviados</strong> y <strong>devoluciones pendientes</strong> de actas vigentes.</Li>
        </ul>
      </>
    ),
  },
};

export function PageInfo({ seccion }: { seccion: Seccion }) {
  const c = CONTENIDO[seccion];
  if (!c) return null;
  return <InfoToggle titulo={c.titulo}>{c.cuerpo}</InfoToggle>;
}
