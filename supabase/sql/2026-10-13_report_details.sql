-- =====================================================================
-- Ficha completa de una alerta para CUALQUIER usuario (2026-10-13)
--
-- Problema: la ficha de una alerta de "perdida" lee especie, raza, edad, sexo, tamaño y color de
-- la mascota (tabla pets), y por RLS cada usuario solo lee SUS mascotas: el dueño la veía completa
-- y las demás cuentas vacía.
--
-- Solución: la función report_details(p_id) devuelve, para la alerta que se está viendo, los datos
-- del reporte y los de su mascota. Es SECURITY DEFINER (como reports_near, que ya devuelve el
-- nombre y la foto de la mascota) y SOLO expone lo que muestra la ficha: nada del dueño ni otras
-- mascotas. Devuelve el mismo formato que la app ya usa (getReportDetails), así que no hay que
-- cambiar nada más. Funciona con alertas viejas y nuevas, al instante.
--
-- Supabase → SQL Editor → pegar y ejecutar. Se puede ejecutar más de una vez.
-- =====================================================================

create or replace function public.report_details(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', r.id,
    'type', r.type,
    'description', r.description,
    'photos', r.photos,
    'sex', r.sex,
    'breed', r.breed,
    'color', r.color,
    'size', r.size,
    'age_estimate', r.age_estimate,
    'lost_at', r.lost_at,
    'created_at', r.created_at,
    'species', case when sr.id is null then null else jsonb_build_object('name', sr.name) end,
    'pet', case when p.id is null then null else jsonb_build_object(
      'name', p.name,
      'breed', p.breed,
      'sex', p.sex,
      'size', p.size,
      'color', p.color,
      'birth_date', p.birth_date,
      'photo_url', p.photo_url,
      'description', p.description,
      'species', case when sp.id is null then null else jsonb_build_object('name', sp.name) end
    ) end
  )
  from public.reports r
  left join public.pets p on p.id = r.pet_id
  left join public.species sp on sp.id = p.species_id
  left join public.species sr on sr.id = r.species_id
  where r.id = p_id;
$$;

revoke all on function public.report_details(uuid) from public;
grant execute on function public.report_details(uuid) to authenticated;

-- Que la API de Supabase vea la función nueva al instante (si no, responde 404 un rato)
notify pgrst, 'reload schema';

-- Prueba (cambia el id por el de una alerta): debe traer "pet" con sus datos
-- select public.report_details('00000000-0000-0000-0000-000000000000');
