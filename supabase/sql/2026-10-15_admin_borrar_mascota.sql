-- =====================================================================
-- Admin: quitar una mascota de otra persona (2026-10-15)
--
-- La app ya deja al admin borrar alertas y publicaciones (admin_delete_report / admin_delete_post,
-- migración 0055). Para las mascotas (p. ej. una publicación de adopción que no corresponde) no había
-- forma: la RLS de pets solo deja editar al dueño.
--
-- admin_delete_pet hace un BORRADO LÓGICO (deleted_at), igual que cuando el dueño borra su mascota:
-- deja de verse en "En adopción", en los perfiles y en las búsquedas, pero no se pierden los datos
-- (sus alertas y publicaciones viejas siguen funcionando). Solo la puede usar un admin.
--
-- Supabase → SQL Editor → pegar y ejecutar. Se puede ejecutar más de una vez.
-- =====================================================================

create or replace function public.admin_delete_pet(p_pet_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Solo un administrador puede quitar mascotas de otros usuarios';
  end if;

  update public.pets
     set deleted_at = coalesce(deleted_at, now())
   where id = p_pet_id;

  if not found then
    raise exception 'Esa mascota no existe';
  end if;
end;
$$;

revoke all on function public.admin_delete_pet(uuid) from public, anon;
grant execute on function public.admin_delete_pet(uuid) to authenticated;

-- Que la API de Supabase vea la función al instante
notify pgrst, 'reload schema';
