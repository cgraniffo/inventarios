# Inventario de Seguridad (MVP)

Aplicación de gestión de inventario para **empresas de seguridad**: EPP, uniformes,
consumibles, **activos serializados** (radios y equipos por N° de serie),
**asignación a personal** (actas de entrega/devolución), puestos de servicio y alertas.

Basada en el módulo de Inventario de **BData Agro**, ampliada con las
funcionalidades técnicas propias del rubro de seguridad.

## Stack

- **Next.js 16** (App Router) + **TypeScript** estricto
- **Tailwind CSS 4**
- **Supabase** (Postgres) vía `@supabase/ssr`
- `lucide-react` para íconos

## Módulos

| Ruta | Qué hace |
|---|---|
| `/` | Dashboard con KPIs y accesos |
| `/articulos` | EPP / uniformes / consumibles: stock, talla, vida útil, certificación, movimientos y ajuste por conteo |
| `/activos` | Radios y equipos serializados: N° de serie, estado, ubicación, mantención por unidad |
| `/asignaciones` | Actas de entrega y devolución a personal (descuenta stock y marca activos como asignados) |
| `/movimientos` | Historial consolidado de entradas, salidas y ajustes |
| `/personal` | Guardias y operativos |
| `/ubicaciones` | Bodegas, puestos de servicio e instalaciones |
| `/alertas` | Stock crítico, EPP por vencer, certificaciones de activos y devoluciones pendientes |

## Puesta en marcha

```bash
pnpm install

# 1) Copia el ejemplo de variables y completa con tu proyecto Supabase
cp .env.local.example .env.local

# 2) Aplica el schema en tu proyecto Supabase (SQL Editor o CLI)
#    supabase/migrations/0001_init.sql

# 3) Corre el dev server
pnpm dev          # http://localhost:3000
```

## Modelo de datos (8 tablas)

`ubicaciones`, `personal`, `articulos`, `activos`, `asignaciones`,
`asignacion_items`, `inventario_movimientos`, `mantenciones`.

El stock de un artículo = `stock_inicial + Σ movimientos` (mismo patrón que un
saldo de cuenta). Los activos serializados se trackean por unidad (estado +
asignación + mantención).

## Autenticación

- **Magic links** de Supabase Auth (sin contraseña). Login en `/auth/login`.
- `src/proxy.ts` (antes `middleware.ts`, renombrado por convención de Next 16)
  refresca la sesión en cada request y **protege todas las rutas**: sin sesión
  redirige a `/auth/login`. Públicas: `/auth/*` y `/icon` (favicon).
- Las páginas de la app viven en el route group `src/app/(app)/` (no afecta las
  URLs); su layout verifica la sesión. `/auth/*` usa el layout raíz limpio.
- **RLS solo `authenticated`**: tras el login, las políticas exigen sesión
  (`to authenticated`). El `anon` no puede leer ni escribir. `service_role`
  (migraciones/seed) salta RLS.
- ⚠️ Config Supabase: en **Authentication → URL Configuration**, el *Redirect URL*
  `http://localhost:3000/**` debe estar permitido para que el magic link vuelva
  al callback. Para producción se agrega el dominio real + SMTP propio (Resend).

## Notas del MVP

- **Soft delete** vía `deleted_at` (no se borra físicamente).
- Convenciones heredadas de BData: snake_case en BD, español neutro chileno, UUIDs.
