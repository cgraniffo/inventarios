-- =====================================================================
-- Inventario de Seguridad — schema inicial (MVP)
-- App standalone single-tenant. Convenciones BData: UUIDs, snake_case,
-- soft delete (deleted_at), timestamptz para sistema, date para operación.
-- RLS: habilitada con políticas PERMISIVAS para el MVP (single-user, sin
-- auth todavía). Más adelante: auth real + políticas por rol.
-- =====================================================================

create extension if not exists "pgcrypto";

-- updated_at automático
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- Ubicaciones (bodegas + puestos de servicio) ----------
create table ubicaciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null default 'bodega'
    check (tipo in ('bodega_central','bodega','puesto_servicio','instalacion')),
  direccion text,
  responsable text,
  telefono text,
  activo boolean not null default true,
  observacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------- Personal (guardias / operativos) ----------
create table personal (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  rut text,
  cargo text,
  ubicacion_id uuid references ubicaciones(id) on delete set null,
  telefono text,
  email text,
  fecha_ingreso date,
  activo boolean not null default true,
  observacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------- Artículos (consumibles + EPP por cantidad) ----------
create table articulos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  codigo text,
  categoria text not null default 'consumible'
    check (categoria in ('epp','uniforme','consumible','equipamiento','comunicaciones','accesorio','otro')),
  unidad text not null default 'un',
  -- EPP / uniforme
  es_epp boolean not null default false,
  talla text,
  norma_certificacion text,
  vida_util_meses integer,
  requiere_devolucion boolean not null default false,
  -- stock
  stock_inicial numeric not null default 0,
  fecha_stock_inicial date,
  stock_minimo numeric not null default 0,
  umbral_rojo numeric,
  umbral_amarillo numeric,
  precio_referencia numeric not null default 0,
  ubicacion_id uuid references ubicaciones(id) on delete set null,
  activo boolean not null default true,
  observacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------- Activos serializados (radios, equipos, etc.) ----------
create table activos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,                  -- descripción / tipo
  marca text,
  modelo text,
  numero_serie text,
  categoria text not null default 'comunicaciones'
    check (categoria in ('comunicaciones','equipamiento','epp','vehiculo','armamento','otro')),
  estado text not null default 'operativo'
    check (estado in ('operativo','asignado','en_reparacion','baja','extraviado')),
  ubicacion_id uuid references ubicaciones(id) on delete set null,
  asignado_a uuid references personal(id) on delete set null,
  fecha_adquisicion date,
  valor numeric,
  vida_util_meses integer,
  fecha_vencimiento date,                -- certificación / garantía / vida útil
  observacion text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index activos_numero_serie_uniq
  on activos (lower(numero_serie))
  where numero_serie is not null and deleted_at is null;

-- ---------- Asignaciones (entrega / cargo a personal) ----------
create table asignaciones (
  id uuid primary key default gen_random_uuid(),
  folio serial,                          -- número de acta legible
  personal_id uuid not null references personal(id) on delete restrict,
  ubicacion_id uuid references ubicaciones(id) on delete set null,
  fecha_entrega date not null default current_date,
  estado text not null default 'vigente'
    check (estado in ('vigente','devuelto_parcial','devuelto','anulada')),
  firmada boolean not null default false,
  observacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------- Ítems de una asignación ----------
create table asignacion_items (
  id uuid primary key default gen_random_uuid(),
  asignacion_id uuid not null references asignaciones(id) on delete cascade,
  articulo_id uuid references articulos(id) on delete set null,  -- ítem por cantidad
  activo_id uuid references activos(id) on delete set null,      -- ítem serializado
  cantidad numeric not null default 1,
  talla text,
  fecha_devolucion date,
  estado text not null default 'entregado'
    check (estado in ('entregado','devuelto','perdido','dado_de_baja')),
  observacion text,
  created_at timestamptz not null default now()
);

-- ---------- Movimientos de inventario (artículos por cantidad) ----------
create table inventario_movimientos (
  id uuid primary key default gen_random_uuid(),
  articulo_id uuid not null references articulos(id) on delete cascade,
  tipo text not null check (tipo in ('entrada','salida','ajuste')),
  cantidad numeric not null,             -- con signo: entrada +, salida -, ajuste = delta
  origen text not null default 'manual'
    check (origen in ('manual','ajuste','asignacion','devolucion','compra','baja')),
  ubicacion_id uuid references ubicaciones(id) on delete set null,
  asignacion_id uuid references asignaciones(id) on delete set null,
  fecha date not null default current_date,
  valor_unitario numeric,
  valor_total numeric,
  observacion text,
  created_at timestamptz not null default now()
);

-- ---------- Mantenciones (activos serializados) ----------
create table mantenciones (
  id uuid primary key default gen_random_uuid(),
  activo_id uuid not null references activos(id) on delete cascade,
  fecha date not null default current_date,
  tipo text not null default 'preventiva'
    check (tipo in ('preventiva','correctiva','inspeccion','calibracion')),
  descripcion text,
  costo numeric,
  proveedor text,
  proximo_vencimiento date,
  estado text not null default 'realizada'
    check (estado in ('programada','realizada','pendiente')),
  created_at timestamptz not null default now()
);

-- ---------- Triggers updated_at ----------
create trigger trg_ubicaciones_updated before update on ubicaciones for each row execute function set_updated_at();
create trigger trg_personal_updated    before update on personal    for each row execute function set_updated_at();
create trigger trg_articulos_updated    before update on articulos    for each row execute function set_updated_at();
create trigger trg_activos_updated      before update on activos      for each row execute function set_updated_at();
create trigger trg_asignaciones_updated before update on asignaciones for each row execute function set_updated_at();

-- ---------- Índices ----------
create index idx_mov_articulo     on inventario_movimientos(articulo_id);
create index idx_activos_estado   on activos(estado);
create index idx_asig_personal    on asignaciones(personal_id);
create index idx_asigitems_asig   on asignacion_items(asignacion_id);
create index idx_mant_activo      on mantenciones(activo_id);

-- ---------- RLS permisiva (MVP) ----------
do $$
declare t text;
begin
  foreach t in array array[
    'ubicaciones','personal','articulos','activos',
    'asignaciones','asignacion_items','inventario_movimientos','mantenciones'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format(
      'create policy %I on %I for all to anon, authenticated using (true) with check (true);',
      t || '_all', t
    );
  end loop;
end $$;

-- ---------- Seed mínimo ----------
insert into ubicaciones (nombre, tipo, responsable)
values ('Bodega Central', 'bodega_central', 'Pañol');
