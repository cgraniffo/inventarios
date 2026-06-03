import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-static";

export default function ManualPage() {
  return (
    <div>
      <PageHeader
        titulo="📖 Manual de Usuario"
        subtitulo="Guía completa del sistema de inventario, conceptos, glosario y hoja de ruta."
      />
      <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6">
        {/* Aviso Demo MVP */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-lg font-bold text-amber-900">⚠️ Esto es un Demo (MVP)</h2>
          <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
            Estás viendo un <strong>Producto Mínimo Viable</strong> (MVP): una versión funcional pero
            inicial, hecha para <strong>mostrar el concepto y validar el flujo</strong> de gestión de
            inventario en una empresa de seguridad. Funciona de verdad (guarda datos, calcula stock,
            genera actas en PDF), pero <strong>los datos cargados son de ejemplo</strong> y todavía
            faltan funcionalidades de una versión productiva (roles, reportes avanzados, integración
            con compras, etc. — ver la <a href="#roadmap" className="font-semibold underline">hoja de ruta</a> al final).
          </p>
          <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
            Está basado en el módulo de Inventario de <strong>BData Agro</strong> y ampliado con las
            necesidades técnicas del rubro seguridad: EPP con tallas y vida útil, activos
            serializados (radios, equipos) y actas de entrega a personal.
          </p>
        </div>

        {/* Índice */}
        <Toc />

        {/* 1. Qué es */}
        <Section id="que-es" titulo="1. ¿Qué resuelve este sistema?">
          <P>
            Centraliza el control del material de una empresa de seguridad en un solo lugar: cuánto
            hay, dónde está, quién lo tiene y qué necesita atención. Reemplaza las planillas Excel
            sueltas y los cuadernos de pañol.
          </P>
          <Ul>
            <Li><strong>Saber el stock real</strong> de EPP, uniformes y consumibles, con alertas cuando algo se está agotando.</Li>
            <Li><strong>Controlar equipos serializados</strong> (radios, detectores, vehículos) por número de serie, con su estado y mantenciones.</Li>
            <Li><strong>Dejar registro de quién recibió qué</strong> mediante actas de entrega firmables, y controlar las devoluciones.</Li>
            <Li><strong>Anticipar problemas</strong>: EPP por vencer, certificaciones caducadas, equipos en reparación, devoluciones pendientes.</Li>
          </Ul>
        </Section>

        {/* 2. Primeros pasos */}
        <Section id="primeros-pasos" titulo="2. Primeros pasos (flujo recomendado)">
          <P>Para cargar tu operación desde cero, el orden sugerido es:</P>
          <ol className="space-y-1.5 text-sm text-slate-700">
            <Paso n={1}><strong>Ubicaciones</strong>: crea tus bodegas y puestos de servicio.</Paso>
            <Paso n={2}><strong>Personal</strong>: agrega a tus guardias y operativos.</Paso>
            <Paso n={3}><strong>Artículos / EPP</strong>: crea el catálogo (EPP, uniformes, consumibles) con su stock inicial, mínimo y precio.</Paso>
            <Paso n={4}><strong>Activos serializados</strong>: registra radios y equipos con su número de serie.</Paso>
            <Paso n={5}><strong>Asignaciones</strong>: entrega material al personal con un acta (descuenta stock y marca los activos).</Paso>
            <Paso n={6}><strong>Alertas</strong>: revísalas periódicamente para reponer y dar mantención a tiempo.</Paso>
          </ol>
        </Section>

        {/* 3. Conceptos clave */}
        <Section id="conceptos" titulo="3. Conceptos clave">
          <h3 className="font-semibold text-slate-900">Cómo se calcula el stock</h3>
          <P>
            El stock actual de un artículo es: <code className="rounded bg-slate-100 px-1 text-[13px]">stock inicial + suma de movimientos</code>.
            Cada entrada suma, cada salida resta y un ajuste lleva el stock al valor real contado.
            Es el mismo principio que el saldo de una cuenta corriente.
          </P>
          <h3 className="mt-3 font-semibold text-slate-900">Semáforo de stock</h3>
          <Ul>
            <Li>🟢 <strong>Verde</strong>: por sobre el mínimo.</Li>
            <Li>🟡 <strong>Amarillo</strong>: igual o por debajo del mínimo.</Li>
            <Li>🔴 <strong>Rojo</strong>: sin stock, o por debajo del 50% del mínimo (o de un umbral propio).</Li>
          </Ul>
          <h3 className="mt-3 font-semibold text-slate-900">Estados de un activo serializado</h3>
          <P><Pill>operativo</Pill> <Pill>asignado</Pill> <Pill>en reparación</Pill> <Pill>dado de baja</Pill> <Pill>extraviado</Pill></P>
          <h3 className="mt-3 font-semibold text-slate-900">Estados de un acta de entrega</h3>
          <P><Pill>vigente</Pill> <Pill>devuelto parcial</Pill> <Pill>devuelto</Pill> — se recalculan solos al devolver ítems.</P>
        </Section>

        {/* 4. Guía por módulo */}
        <Section id="modulos" titulo="4. Guía por módulo">
          <Modulo titulo="📦 Artículos / EPP">
            Material controlado por cantidad. Tres pestañas: <strong>Stock actual</strong> (semáforo y
            valorización), <strong>Movimientos</strong> (historial) y <strong>Maestro</strong> (crear/editar).
            Marca “Es EPP” para habilitar talla, norma/certificación, vida útil y “requiere devolución”.
            Usa <strong>+ Movimiento</strong> para una entrada/salida y <strong>⚖️ Ajustar</strong> para corregir según un conteo físico.
          </Modulo>
          <Modulo titulo="📻 Activos serializados">
            Bienes únicos con número de serie (radios, equipos, vehículos). Cada unidad lleva su estado,
            ubicación o persona asignada, y fecha de vencimiento de certificación/garantía. El botón
            <strong> 🔧</strong> registra mantenciones, muestra el historial por unidad y cambia el estado.
          </Modulo>
          <Modulo titulo="📋 Asignaciones">
            Actas de entrega de material a una persona. Entregar un artículo descuenta su stock; entregar
            un activo lo marca como “asignado”. Devolver reingresa el stock o libera el activo; “perdido”
            no reingresa. El trabajador puede <strong>firmar el acta en pantalla</strong> (✍️, con el dedo
            o el mouse) y la firma queda incrustada en el <strong>📄 PDF</strong>.
          </Modulo>
          <Modulo titulo="🔁 Movimientos">
            Historial consolidado de entradas, salidas y ajustes de todos los artículos, con su origen
            (manual, asignación, devolución, etc.).
          </Modulo>
          <Modulo titulo="👮 Personal">
            Guardias y operativos a quienes se entrega material. Se usan en las asignaciones y al asignar
            activos.
          </Modulo>
          <Modulo titulo="📍 Ubicaciones">
            Bodegas, puestos de servicio e instalaciones donde se almacena o usa el material.
          </Modulo>
          <Modulo titulo="🔔 Alertas">
            Tablero de lo que requiere atención: stock bajo, EPP por vencer, certificaciones de activos,
            equipos en reparación o extraviados, y devoluciones pendientes.
          </Modulo>
          <Modulo titulo="✨ Asistente IA (Sr. Bodega)">
            Un chat para consultar el inventario en lenguaje natural (“¿cuántos cascos talla L quedan?”,
            “¿quién tiene la radio MOT-DEP450-00123?”). Responde usando solo tus datos reales y puede sumar,
            contar y valorizar. Requiere configurar la clave de IA.
          </Modulo>
        </Section>

        {/* 5. Acceso */}
        <Section id="acceso" titulo="5. Acceso y seguridad">
          <Ul>
            <Li><strong>Ingreso sin contraseña</strong>: pides un enlace de acceso (“magic link”) a tu correo y entras con un clic.</Li>
            <Li><strong>Sesión protegida</strong>: todas las páginas exigen estar logueado; si no, te redirige al login.</Li>
            <Li><strong>Base de datos cerrada</strong>: solo usuarios autenticados pueden leer o escribir datos.</Li>
            <Li>Para salir, usa <strong>“Salir”</strong> en la parte inferior del menú.</Li>
          </Ul>
        </Section>

        {/* 6. Glosario */}
        <Section id="glosario" titulo="6. Glosario de términos">
          <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            <Termino t="Acta de entrega (cargo)">Documento que registra el material entregado a una persona y su compromiso de devolverlo. Se puede firmar en pantalla y exportar a PDF.</Termino>
            <Termino t="Activo serializado">Bien único e identificable por un número de serie (radio, equipo, vehículo). Se controla unidad por unidad, no por cantidad.</Termino>
            <Termino t="Asistente IA (Sr. Bodega)">Chat que responde preguntas sobre el inventario en lenguaje natural, usando solo tus datos reales (impulsado por IA).</Termino>
            <Termino t="Ajuste de stock">Movimiento que lleva el stock calculado al valor real obtenido en un conteo físico (corrige diferencias o merma).</Termino>
            <Termino t="Alerta">Aviso de algo que requiere atención: stock bajo, vencimiento, reparación o devolución pendiente.</Termino>
            <Termino t="Consumible">Artículo que se gasta y no se devuelve (pilas, precintos, guantes de látex).</Termino>
            <Termino t="EPP">Equipo de Protección Personal: casco, guantes, botas, antiparras, chaleco, etc. Suele tener talla, norma y vida útil.</Termino>
            <Termino t="Firma digital">Firma manuscrita capturada en pantalla (con el dedo o el mouse) que queda guardada en el acta y se incrusta en su PDF.</Termino>
            <Termino t="Magic link">Enlace de acceso de un solo uso que llega al correo; reemplaza a la contraseña.</Termino>
            <Termino t="Mantención">Intervención sobre un activo: preventiva, correctiva, inspección o calibración. Queda en su historial.</Termino>
            <Termino t="Movimiento">Cualquier entrada (+), salida (−) o ajuste que cambia el stock de un artículo.</Termino>
            <Termino t="Norma / certificación">Estándar que cumple un EPP (ej. EN 388 para guantes, NIJ IIIA para chalecos antibalas).</Termino>
            <Termino t="Número de serie (S/N)">Identificador único de una unidad serializada. No se puede repetir.</Termino>
            <Termino t="Puesto de servicio">Lugar donde opera el personal de seguridad (mall, edificio, instalación industrial).</Termino>
            <Termino t="RLS (seguridad por fila)">Mecanismo de la base de datos que impide leer o escribir datos sin sesión iniciada.</Termino>
            <Termino t="Semáforo de stock">Indicador de color (🟢🟡🔴) que resume si un artículo está bien, bajo o crítico respecto a su mínimo.</Termino>
            <Termino t="Soft delete">Borrado “suave”: el registro se oculta (marca de eliminado) en vez de borrarse físicamente, para conservar trazabilidad.</Termino>
            <Termino t="Stock inicial / actual / mínimo">Inicial: conteo de partida. Actual: inicial + movimientos. Mínimo: nivel bajo el cual conviene reponer.</Termino>
            <Termino t="Umbral (rojo / amarillo)">Niveles personalizados por artículo para definir cuándo pasa a 🔴 o 🟡, en vez de la regla automática.</Termino>
            <Termino t="Valorización">Valor económico del stock = cantidad × precio unitario de referencia.</Termino>
            <Termino t="Vida útil">Tiempo que un EPP sirve desde su puesta en uso; vencida, debe reemplazarse.</Termino>
          </dl>
        </Section>

        {/* 7. Roadmap */}
        <Section id="roadmap" titulo="7. Hoja de ruta — funcionalidades a futuro">
          <P>
            Funcionalidades factibles de implementar sobre esta base. Las marcadas con <IaTag /> pueden
            ser <strong>impulsadas por Inteligencia Artificial</strong> (varias ya existen en BData y se
            pueden adaptar). Las marcadas con <HechoTag /> <strong>ya están implementadas</strong> en esta versión.
          </P>

          <h3 className="mt-4 font-semibold text-slate-900">Operación y control</h3>
          <ol className="mt-2 space-y-2">
            <Feat n={1} t="Roles y permisos">Perfiles admin, jefe de bodega, operador y solo-lectura, con accesos por módulo.</Feat>
            <Feat n={2} t="Lista de correos autorizados">Restringir el ingreso únicamente a los correos de tu equipo.</Feat>
            <Feat n={3} t="Importar y exportar Excel / CSV">Carga masiva de artículos, personal y activos; exportación de reportes.</Feat>
            <Feat n={4} t="Multi-bodega con traspasos">Stock por ubicación y movimientos de traspaso entre bodegas/puestos.</Feat>
            <Feat n={5} t="Kardex valorizado por artículo">Libro de movimientos con costo (PEPS o promedio) y saldo valorizado.</Feat>
            <Feat n={6} t="Órdenes de compra y reposición">Generar OC cuando el stock cae bajo el mínimo, con seguimiento de recepción.</Feat>
            <Feat n={7} t="Bitácora de auditoría">Registro de quién hizo cada cambio y cuándo.</Feat>
            <Feat n={8} t="Gestión de proveedores y costos históricos">Catálogo de proveedores y evolución de precios de compra.</Feat>
          </ol>

          <h3 className="mt-4 font-semibold text-slate-900">Terreno y experiencia</h3>
          <ol className="mt-2 space-y-2" start={9}>
            <Feat n={9} t="Códigos QR / código de barras">Entregar y devolver escaneando el activo o artículo con el celular.</Feat>
            <Feat n={10} t="Etiquetas QR imprimibles">Generar e imprimir etiquetas por activo y por ubicación.</Feat>
            <Feat n={11} t="Firma digital del acta" hecho>El trabajador firma con el dedo en pantalla; queda incrustada en el PDF.</Feat>
            <Feat n={12} t="App móvil / PWA instalable">Instalable en el celular para usar en bodega y en terreno, incluso offline.</Feat>
            <Feat n={13} t="Programación de mantenciones">Calendario de mantenciones preventivas con recordatorios automáticos.</Feat>
            <Feat n={14} t="Trazabilidad de lote y ciclo de vida del EPP">Seguir cada lote desde la compra hasta el recambio programado.</Feat>
            <Feat n={15} t="Notificaciones por correo / WhatsApp">Avisos automáticos de stock crítico, EPP por vencer y mantención.</Feat>
          </ol>

          <h3 className="mt-4 font-semibold text-slate-900">Impulsadas por IA <IaTag /></h3>
          <ol className="mt-2 space-y-2" start={16}>
            <Feat n={16} t="Asistente conversacional de bodega" ia hecho>Preguntar en lenguaje natural: “¿cuántos cascos talla L quedan?”, “¿quién tiene la radio MOT-DEP450-00123?”.</Feat>
            <Feat n={17} t="Lectura de facturas y guías (OCR)" ia>Subir una factura o guía de despacho y que la IA extraiga los ítems y cantidades para ingresarlos como compra (ya existe en BData).</Feat>
            <Feat n={18} t="Predicción de quiebre de stock" ia>Estimar cuándo se agotará cada artículo según el consumo histórico y sugerir cuánto reponer.</Feat>
            <Feat n={19} t="Reconocimiento de EPP/equipo por foto" ia>Clasificar y registrar un artículo a partir de una imagen (modelo, tipo, estado).</Feat>
            <Feat n={20} t="Detección de anomalías y pérdidas" ia>Identificar consumos atípicos o pérdidas recurrentes por persona o puesto.</Feat>
            <Feat n={21} t="Resumen y priorización inteligente de alertas" ia>Un resumen diario que ordena qué atender primero y por qué.</Feat>
          </ol>

          <p className="mt-4 text-xs text-slate-500">
            Total: <strong>21 funcionalidades</strong> propuestas, <strong>6 potenciadas por IA</strong>.
            <strong> 2 ya implementadas</strong> en esta versión (firma digital del acta y asistente IA).
            La hoja de ruta se prioriza según tus necesidades.
          </p>
        </Section>

        <div className="flex items-center justify-center gap-1.5 pb-4 pt-2 text-[11px] text-slate-400">
          Desarrollado por
          <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-emerald-600 text-[10px] font-bold leading-none text-white">b</span>
          <span className="font-semibold text-slate-500">BData</span>
        </div>
      </div>
    </div>
  );
}

/* ───────── helpers ───────── */

function Toc() {
  const items = [
    ["que-es", "1. ¿Qué resuelve?"],
    ["primeros-pasos", "2. Primeros pasos"],
    ["conceptos", "3. Conceptos clave"],
    ["modulos", "4. Guía por módulo"],
    ["acceso", "5. Acceso y seguridad"],
    ["glosario", "6. Glosario"],
    ["roadmap", "7. Hoja de ruta"],
  ];
  return (
    <nav className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Contenido</p>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {items.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="text-sm text-emerald-700 hover:underline">
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function Section({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="mb-3 border-b border-slate-200 pb-2 text-xl font-bold text-slate-900">{titulo}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="leading-relaxed text-slate-700">{children}</p>;
}
function Ul({ children }: { children: ReactNode }) {
  return <ul className="space-y-1">{children}</ul>;
}
function Li({ children }: { children: ReactNode }) {
  return <li className="ml-4 list-disc">{children}</li>;
}
function Paso({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">{n}</span>
      <span>{children}</span>
    </li>
  );
}
function Pill({ children }: { children: ReactNode }) {
  return <span className="mr-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{children}</span>;
}
function Modulo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="font-semibold text-slate-900">{titulo}</h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">{children}</p>
    </div>
  );
}
function Termino({ t, children }: { t: string; children: ReactNode }) {
  return (
    <div className="px-4 py-3">
      <dt className="text-sm font-semibold text-slate-900">{t}</dt>
      <dd className="mt-0.5 text-sm leading-relaxed text-slate-600">{children}</dd>
    </div>
  );
}
function IaTag() {
  return <span className="inline-block rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-800">✨ IA</span>;
}
function HechoTag() {
  return <span className="inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">✅ Listo</span>;
}
function Feat({ n, t, ia, hecho, children }: { n: number; t: string; ia?: boolean; hecho?: boolean; children: ReactNode }) {
  return (
    <li className="flex gap-2.5 rounded-lg border border-slate-200 bg-white p-3">
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${hecho ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{n}</span>
      <div>
        <p className="text-sm font-semibold text-slate-900">
          {t} {ia && <IaTag />} {hecho && <HechoTag />}
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{children}</p>
      </div>
    </li>
  );
}
