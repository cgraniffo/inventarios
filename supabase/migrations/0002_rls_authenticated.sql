-- =====================================================================
-- Cierra el acceso anónimo: las políticas pasan de (anon, authenticated)
-- a solo authenticated. Ahora la BD solo responde a usuarios con sesión
-- iniciada (magic link de Supabase Auth). El service_role sigue saltando
-- RLS (para migraciones/seed vía MCP).
-- =====================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'ubicaciones','personal','articulos','activos',
    'asignaciones','asignacion_items','inventario_movimientos','mantenciones'
  ]
  loop
    execute format('drop policy if exists %I on %I;', t || '_all', t);
    execute format(
      'create policy %I on %I for all to authenticated using (true) with check (true);',
      t || '_auth', t
    );
  end loop;
end $$;
