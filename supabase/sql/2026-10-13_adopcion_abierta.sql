-- =====================================================================
-- Adopción abierta a todos (2026-10-13)
--
-- La migración 0046 (web-development) creó el trigger `enforce_adoption_verified` en `pets`:
-- solo veterinarios o refugios verificados podían poner una mascota en status 'for_adoption'
-- ("Solo veterinarios o refugios verificados pueden publicar mascotas en adopción", P0001).
--
-- Ahora CUALQUIER usuario puede dar una mascota en adopción. Si quien publica es una veterinaria
-- o un refugio verificado, la app le pone una etiqueta extra ("✓ Veterinaria" / "✓ Refugio").
--
-- Este script solo quita ese bloqueo: no toca las otras reglas de `pets` (RLS del dueño,
-- prevent_duplicate_pet, eliminación lógica). Se puede ejecutar más de una vez.
-- Supabase → SQL Editor → pegar y ejecutar.
-- =====================================================================

-- 1. Ver qué triggers tiene `pets` antes del cambio (informativo)
select t.tgname as trigger, p.proname as funcion
from pg_trigger t
join pg_proc p on p.oid = t.tgfoid
where t.tgrelid = 'public.pets'::regclass
  and not t.tgisinternal
order by 1;

-- 2. Quitar el trigger que bloquea la adopción a usuarios normales.
--    Se busca por el texto de su error, por si en Supabase tiene otro nombre.
do $$
declare
  r record;
begin
  for r in
    select t.tgname
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'public.pets'::regclass
      and not t.tgisinternal
      and (t.tgname = 'enforce_adoption_verified' or p.prosrc ilike '%refugios verificados%')
  loop
    execute format('drop trigger if exists %I on public.pets', r.tgname);
    raise notice 'Trigger eliminado: %', r.tgname;
  end loop;
end $$;

-- 3. Comprobar: ya no debe aparecer el trigger de adopción
select t.tgname as trigger, p.proname as funcion
from pg_trigger t
join pg_proc p on p.oid = t.tgfoid
where t.tgrelid = 'public.pets'::regclass
  and not t.tgisinternal
order by 1;
