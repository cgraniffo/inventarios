# Inventario de Seguridad — Contexto del Proyecto

> Memoria larga del proyecto. Claude Code la lee al inicio de cada sesión. Si cambias algo
> importante, actualiza este archivo.

---

## 1. Quién soy yo (Christian)

Soy **Christian Graniffo** (christian@bdata.cl), fundador de **BData**. Trabajo solo, desde Chile.

- NO soy desarrollador profesional: entiendo conceptos (BD, APIs, auth) pero **el código lo escribes tú**.
- Explica cada cambio en 2-3 líneas **antes** de hacerlo. Para cambios grandes, propón plan de archivos y espera mi OK.
- Haz el trabajo técnico directo (editar, correr, commitear, push). No me pidas pegar comandos salvo casos puntuales (ej. login interactivo, que corro con el prefijo `!`).
- Idioma: **español neutro chileno** (tú/te/tienes; modismos suaves "po"/"cachai" ok; NO voseo argentino).
- Prefiero commits frecuentes y chicos. Después de cambios, dime qué validar en el navegador.

---

## 2. Qué es esto

**MVP** de gestión de inventario para una **empresa de seguridad**. Standalone, basado en el módulo
de Inventario de **BData Agro** (`../bdata-web`) pero ampliado al rubro: EPP con tallas/vida útil,
activos serializados (radios, equipos), actas de entrega a personal, mantenciones.

Branded como **"Empresa Demo"** (placeholder; rebranding = buscar/reemplazar "Empresa Demo"). Pie
"Desarrollado por BData" en sidebar, login, actas PDF y correos.

**Producción**: https://classy-phoenix-4fb2b9.netlify.app

---

## 3. Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack) + TypeScript estricto + React 19 + Tailwind 4 |
| BD/Auth | Supabase (Postgres 17) vía `@supabase/ssr`. Auth = magic links (sin contraseña) |
| PDF | `@react-pdf/renderer` (acta de entrega) |
| IA | `@anthropic-ai/sdk` (Claude Haiku 4.5) — asistente conversacional |
| Íconos | `lucide-react` |
| Package manager | **pnpm** (NO npm/yarn) |
| Hosting | **Netlify** (auto-deploy desde `main`) |
| Repo | github.com/cgraniffo/inventarios (privado) |

**Supabase**: proyecto **dedicado** `inventario-seguridad`, id **`jcbnrtuicqlbwxvambch`**, región
`sa-east-1` (São Paulo), org BData. US$10/mes. **No es** bdata-platform.

---

## 4. Autenticación y seguridad

- **Magic link** de Supabase: login en `/auth/login` → `signInWithOtp` → `/auth/callback` canjea el código.
- **`src/proxy.ts`** (Next 16 renombró `middleware`→`proxy`; usar `export function proxy`): refresca la
  sesión en cada request (necesario para PKCE) y **protege todas las rutas** (sin sesión → `/auth/login`).
  Públicas: `/auth/*` y `/icon`.
- Páginas de la app en route group **`src/app/(app)/`** (no cambia URLs); su `layout.tsx` valida sesión.
  `/auth/*` usa el layout raíz limpio (sin nav).
- **RLS solo `authenticated`** (migración 0002): la BD no responde a `anon`. `service_role`
  (migraciones/seed vía MCP) salta RLS.
- ⚠️ Para que el magic link funcione en un dominio: en **Supabase → Auth → URL Configuration** el
  redirect `https://DOMINIO/**` debe estar permitido. Hoy permitidos: `http://localhost:3000/**` y el
  dominio de Netlify. SMTP: por defecto de Supabase (rate-limited). Pendiente migrar a Resend.

---

## 5. Modelo de datos (8 tablas, todas con RLS authenticated)

- **`ubicaciones`** — bodegas y puestos de servicio (tipo: bodega_central/bodega/puesto_servicio/instalacion).
- **`personal`** — guardias/operativos (nombre, rut, cargo, ubicacion_id).
- **`articulos`** — control por cantidad (EPP/uniforme/consumible/equipamiento/comunicaciones/accesorio).
  Campos EPP: `es_epp, talla, norma_certificacion, vida_util_meses, requiere_devolucion`. Stock:
  `stock_inicial, stock_minimo, umbral_rojo, umbral_amarillo, precio_referencia`.
- **`activos`** — serializados (radios, equipos). `numero_serie` único, `estado`
  (operativo/asignado/en_reparacion/baja/extraviado), `asignado_a`, `fecha_vencimiento`.
- **`asignaciones`** — actas de entrega. `folio` (serial), `estado`
  (vigente/devuelto_parcial/devuelto/anulada), `firmada`, `firma_data` (PNG dataURL), `firmada_at`.
- **`asignacion_items`** — ítems de un acta (articulo_id o activo_id, cantidad, talla, estado).
- **`inventario_movimientos`** — entradas(+)/salidas(−)/ajustes. `origen`
  (manual/ajuste/asignacion/devolucion/compra/baja).
- **`mantenciones`** — por activo (preventiva/correctiva/inspeccion/calibracion).

**Stock actual = `stock_inicial + Σ movimientos`** (`src/lib/inventario/stock.ts`). Semáforo:
🔴 sin stock o ≤50% del mínimo · 🟡 ≤ mínimo · 🟢 ok (o umbrales propios). Migraciones en
`supabase/migrations/` (aplicar con MCP `apply_migration`).

---

## 6. Estructura de archivos

```
src/
├── app/
│   ├── layout.tsx              # raíz minimal (html/body)
│   ├── icon.tsx                # favicon BData ("b" verde, next/og)
│   ├── globals.css
│   ├── auth/{login,callback,check-email}
│   ├── api/
│   │   ├── asignaciones/[id]/pdf/route.tsx   # acta en PDF (con firma)
│   │   └── asistente/route.ts                # endpoint del asistente IA
│   └── (app)/                  # route group con sesión + nav
│       ├── layout.tsx          # valida sesión, redirige a login
│       ├── page.tsx            # dashboard
│       ├── articulos/ activos/ asignaciones/ movimientos/
│       ├── personal/ ubicaciones/ alertas/
│       ├── asistente/          # chat IA (Sr. Bodega)
│       └── manual/             # Manual de Usuario (glosario + roadmap)
├── components/   nav, page-header, page-info (toggles), kpi, ui, signature-pad, logout-button
├── lib/
│   ├── supabase/{client,server}.ts
│   ├── inventario/stock.ts     # cálculo de stock + semáforo
│   ├── ai/{claude,contexto}.ts # wrapper Claude + snapshot del inventario
│   ├── pdf/acta-pdf.tsx
│   ├── format.ts  constants.ts  types.ts
└── proxy.ts                    # sesión + portería (antes middleware.ts)

docs/   deploy.md, email/ (6 templates HTML de auth con marca BData)
supabase/migrations/  0001_init, 0002_rls_authenticated, 0003_firma_asignaciones
```

Patrón por feature: `page.tsx` (server) + `_cliente.tsx` (client, prefijo `_`) + `_actions.ts`
(server actions, `"use server"`).

---

## 7. Convenciones de código

- TypeScript estricto, sin `any`. **snake_case en BD** (llega tal cual de Supabase).
- Tablas en plural, FK `{tabla_singular}_id`, UUIDs (`gen_random_uuid()`), **soft delete** vía `deleted_at`.
- TIMESTAMPTZ para sistema, DATE para operación. Zona `America/Santiago`.
- UI en español neutro chileno. Paleta emerald (#059669 / #064e3b) + slate.
- Server actions en `_actions.ts`; componentes cliente prefijados con `_`.

---

## 8. ⭐ Regla permanente: Manual + Toggles

**Siempre** que agregues o cambies una funcionalidad, actualiza también:
- el **Manual de Usuario** (`src/app/(app)/manual/page.tsx`): guía por módulo, glosario y roadmap
  (marca lo ya hecho con ✅).
- los **toggles de ayuda** (`src/components/page-info.tsx`) de la(s) página(s) afectada(s). Página nueva → su propio toggle.

Christian lo pidió como práctica estándar. Es parte de la entrega, no opcional.

---

## 9. Funcionalidades implementadas

Dashboard · Artículos/EPP (stock, talla, vida útil, movimientos, ajuste) · Activos serializados
(estado, mantención) · Asignaciones (actas, **firma digital** en canvas → incrustada en PDF) ·
Movimientos · Personal · Ubicaciones · Alertas (stock bajo, EPP por vencer, certificaciones,
reparación, devoluciones) · **Asistente IA "Sr. Bodega"** · Manual de Usuario · Toggles de ayuda ·
datos de ejemplo cargados.

Roadmap completo (21 features, 6 con IA) está en `/manual`. Implementadas: firma digital + asistente IA.

---

## 10. NUNCA sin avisar

1. ❌ Tocar `.env.local` (tiene claves de Supabase y Anthropic). Está en `.gitignore`.
2. ❌ Commitear secretos.
3. ❌ Desactivar RLS.
4. ❌ `git push --force` ni reescribir historia.
5. ❌ Modificar el schema (CREATE/ALTER/DROP) sin avisar — usar `apply_migration` y comentarlo.
6. ❌ Tocar el repo `bdata-web` ni `alertapet` (otros proyectos).

---

## 11. Deploy

- **GitHub**: github.com/cgraniffo/inventarios, rama `main`. Push local funciona desde Claude Code
  (credenciales del sistema). El conector MCP de GitHub **no puede crear repos** (403) ni es confiable
  con privados → usar git local.
- **Netlify**: sitio `classy-phoenix-4fb2b9` (https://classy-phoenix-4fb2b9.netlify.app). Auto-deploy
  desde `main`. Config en `netlify.toml`. Env vars en el panel de Netlify:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`.
- Tras desplegar, recordar el redirect URL de Supabase (§4) para el dominio de prod.

---

## 12. Aprendizajes operacionales

- **pnpm 11 + Next 16**: pnpm corre un `pnpm install` de verificación antes de cada script que falla
  por build scripts nativos ignorados (sharp, unrs-resolver). Resuelto con `verifyDepsBeforeRun: false`
  en `pnpm-workspace.yaml`. Si igual molesta en local, correr el build directo:
  `node node_modules/next/dist/bin/next build`.
- **Rutas con `(app)` y `[id]`**: el route group `(app)` no afecta URLs. Tras mover archivos o tocar
  `proxy.ts`, **reiniciar el dev server** (el HMR a veces queda en estado roto → 500 en `/`).
- **`middleware`→`proxy`**: Next 16 deprecó `middleware.ts`; usar `src/proxy.ts` con `export function proxy`.
- **Next 16 en Netlify**: muy nuevo; si el build falla, revisar versión de `@netlify/plugin-nextjs` o
  el deploy log de Netlify.
- **Magic link en celular + Netlify (loop de login)** — causa raíz real: (1) usar el flujo PKCE
  (`exchangeCodeForSession`) falla cuando el correo abre el link en otro navegador/webview → cambiar a
  **token-hash** (`/auth/confirm` con `verifyOtp({token_hash,type})`, que es un POST al servidor, sin
  verificador local). Template del correo: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`.
  (2) Netlify le pasa al servidor el host del **deploy** (`<id>--sitio.netlify.app`), no el canónico;
  redirigir con ese `origin` deja la cookie en el host canónico pero manda al del deploy → loop. Fix:
  `src/lib/site-url.ts` `canonicalBase()` normaliza el origen en confirm/callback/proxy. Para dominio
  propio, setear `NEXT_PUBLIC_SITE_URL`.
- **Firma digital**: se guarda como PNG dataURL en `asignaciones.firma_data` (texto). `@react-pdf` la
  incrusta con `<Image src={dataUrl}>`.
- **Asistente IA**: `src/lib/ai/contexto.ts` arma un snapshot del inventario y se lo pasa a Claude con
  prompt caching. Requiere `ANTHROPIC_API_KEY` (si falta, la UI avisa, no se rompe).

---

## 13. Comandos útiles

```powershell
pnpm dev              # puerto 3000
pnpm lint
node node_modules/typescript/bin/tsc --noEmit   # type check
node node_modules/next/dist/bin/next build       # build directo (evita wrapper pnpm)
git push              # desde el cwd del repo
```

---

*Última actualización: deploy inicial en Netlify (classy-phoenix-4fb2b9) + CLAUDE.md.*
