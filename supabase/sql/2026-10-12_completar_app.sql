-- =====================================================================
-- PetClue · cambios de base de datos para completar la app
-- Ejecutar UNA vez en Supabase → SQL Editor → New query → Run.
-- Es seguro volver a ejecutarlo (usa "if not exists" / "or replace").
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Foto de perfil visible para todos (Comunidad, solicitudes, etc.)
--    profiles ya tiene lectura pública; el dueño puede actualizar su fila.
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists avatar_url text;


-- ---------------------------------------------------------------------
-- 2. "Mi clínica": editar un lugar YA verificado
--    La RLS solo deja editar mientras verified = false. Esta función deja
--    al dueño cambiar el teléfono sin perder la verificación; si cambia el
--    nombre, la dirección o el punto en el mapa, vuelve a "pendiente" para
--    que un admin lo revise de nuevo.
-- ---------------------------------------------------------------------
create or replace function public.update_my_clinic(
  p_name    text,
  p_address text,
  p_phone   text,
  p_lat     double precision default null,
  p_lon     double precision default null
) returns void
language plpgsql
security definer
-- PostGIS (st_makepoint, st_setsrid) vive en el esquema "extensions" en Supabase
set search_path = public, extensions
as $$
declare
  v_clinic public.vet_clinics%rowtype;
  v_needs_review boolean;
begin
  select * into v_clinic
    from public.vet_clinics
   where created_by = auth.uid()
   order by created_at desc
   limit 1;

  if not found then
    raise exception 'No tienes un lugar en el mapa';
  end if;

  v_needs_review :=
       coalesce(p_name, '')    is distinct from coalesce(v_clinic.name, '')
    or coalesce(p_address, '') is distinct from coalesce(v_clinic.address, '')
    or (p_lat is not null and p_lon is not null);

  update public.vet_clinics
     set name        = coalesce(nullif(trim(p_name), ''), name),
         address     = p_address,
         phone       = nullif(trim(p_phone), ''),
         location    = case
                         when p_lat is not null and p_lon is not null
                         then st_setsrid(st_makepoint(p_lon, p_lat), 4326)::geography
                         else location
                       end,
         verified    = case when v_needs_review then false else verified end,
         verified_by = case when v_needs_review then null else verified_by end,
         verified_at = case when v_needs_review then null else verified_at end
   where id = v_clinic.id;
end;
$$;

revoke all on function public.update_my_clinic(text, text, text, double precision, double precision) from public, anon;
grant execute on function public.update_my_clinic(text, text, text, double precision, double precision) to authenticated;


-- ---------------------------------------------------------------------
-- 3. Notificaciones con la app cerrada (push con Firebase Cloud Messaging)
--    La app guarda aquí el token del celular; la Edge Function "send-push"
--    lo usa cuando se crea una fila en notifications.
-- ---------------------------------------------------------------------
create table if not exists public.push_tokens (
  token      text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  platform   text not null default 'android',
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

drop policy if exists "push_tokens: dueño" on public.push_tokens;
create policy "push_tokens: dueño" on public.push_tokens
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
