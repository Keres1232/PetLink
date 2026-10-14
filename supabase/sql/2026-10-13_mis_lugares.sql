-- =====================================================================
-- "Mis veterinarias / Mis refugios / Mis consultorios" (2026-10-13)
--
-- Una cuenta de veterinaria o refugio puede tener VARIOS lugares (sedes) en el mapa, como las
-- mascotas de un usuario. Crear una sede ya funciona con create_clinic (queda pendiente). La RLS
-- de vet_clinics solo deja al dueño editar una sede mientras está pendiente; para editar o borrar
-- una ya verificada hacen falta estas funciones (SECURITY DEFINER, solo sobre sedes propias):
--
--   update_my_place(p_id, …)  editar UNA sede: el teléfono cambia al instante; si cambia el
--                             nombre, la dirección o la ubicación, vuelve a "pendiente" y un admin
--                             la revisa otra vez en Moderación → Clínicas.
--   delete_my_place(p_id)     eliminar UNA sede propia.
--   update_my_clinic(…)       la versión anterior (edita la sede más reciente); se deja por compatibilidad.
--
-- Reemplaza a 2026-10-13_update_my_clinic.sql. Supabase → SQL Editor → pegar y ejecutar.
-- Se puede ejecutar más de una vez.
-- =====================================================================

-- 1. Editar una sede propia ------------------------------------------------
create or replace function public.update_my_place(
  p_id      uuid,
  p_name    text,
  p_address text,
  p_phone   text,
  p_lat     double precision default null,
  p_lon     double precision default null
) returns boolean            -- true = volvió a revisión
language plpgsql
security definer
-- PostGIS (st_makepoint, st_setsrid) vive en el esquema "extensions" en Supabase
set search_path = public, extensions
as $$
declare
  v_place public.vet_clinics%rowtype;
  v_needs_review boolean;
begin
  select * into v_place
    from public.vet_clinics
   where id = p_id and created_by = auth.uid();

  if not found then
    raise exception 'Ese lugar no existe o no es tuyo';
  end if;

  v_needs_review :=
       coalesce(nullif(trim(p_name), ''), v_place.name) is distinct from v_place.name
    or coalesce(p_address, '') is distinct from coalesce(v_place.address, '')
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
   where id = v_place.id;

  return v_needs_review and v_place.verified;
end;
$$;

revoke all on function public.update_my_place(uuid, text, text, text, double precision, double precision) from public, anon;
grant execute on function public.update_my_place(uuid, text, text, text, double precision, double precision) to authenticated;


-- 2. Eliminar una sede propia ---------------------------------------------
create or replace function public.delete_my_place(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.vet_clinics where id = p_id and created_by = auth.uid();
  if not found then
    raise exception 'Ese lugar no existe o no es tuyo';
  end if;
end;
$$;

revoke all on function public.delete_my_place(uuid) from public, anon;
grant execute on function public.delete_my_place(uuid) to authenticated;


-- 3. Versión anterior (edita la sede más reciente) ------------------------
create or replace function public.update_my_clinic(
  p_name    text,
  p_address text,
  p_phone   text,
  p_lat     double precision default null,
  p_lon     double precision default null
) returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  select id into v_id
    from public.vet_clinics
   where created_by = auth.uid()
   order by created_at desc
   limit 1;
  if v_id is null then
    raise exception 'No tienes un lugar en el mapa';
  end if;
  perform public.update_my_place(v_id, p_name, p_address, p_phone, p_lat, p_lon);
end;
$$;

revoke all on function public.update_my_clinic(text, text, text, double precision, double precision) from public, anon;
grant execute on function public.update_my_clinic(text, text, text, double precision, double precision) to authenticated;


-- Que la API de Supabase vea las funciones al instante
notify pgrst, 'reload schema';
