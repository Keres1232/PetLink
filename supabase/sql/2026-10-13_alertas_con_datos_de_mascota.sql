-- =====================================================================
-- Alertas de mascota perdida con sus datos (2026-10-13)
--
-- Problema: las alertas de "perdida" publicadas desde la APK solo guardaban pet_id. La ficha
-- (especie, raza, edad, sexo, tamaño, color) se leía de `pets`, y por RLS cada usuario solo lee
-- SUS mascotas → el dueño veía la ficha completa y las demás cuentas la veían vacía.
--
-- La app ya copia esos datos en la alerta al publicarla. Este script hace lo mismo con las
-- alertas que ya existen: copia desde la mascota SOLO los campos que estén vacíos en la alerta.
-- No cambia RLS ni borra nada. Se puede ejecutar más de una vez.
-- Supabase → SQL Editor → pegar y ejecutar.
-- =====================================================================

-- 1. Cuántas alertas tienen mascota pero les faltan datos (antes)
select count(*) as alertas_incompletas
from public.reports r
join public.pets p on p.id = r.pet_id
where r.sex is null or r.breed is null or r.size is null or r.color is null
   or r.species_id is null or r.age_estimate is null;

-- 2. Copiar los datos de la mascota en la alerta (solo lo que falte)
update public.reports r
set
  species_id   = coalesce(r.species_id, p.species_id),
  sex          = coalesce(r.sex, p.sex),
  breed        = coalesce(nullif(r.breed, ''), nullif(p.breed, '')),
  size         = coalesce(r.size, p.size),
  color        = coalesce(nullif(r.color, ''), nullif(p.color, '')),
  age_estimate = coalesce(
    nullif(r.age_estimate, ''),
    case
      when p.birth_date is null then null
      when age(p.birth_date) < interval '1 month' then 'menos de 1 mes'
      when age(p.birth_date) < interval '1 year' then
        extract(month from age(p.birth_date))::int || ' meses'
      when extract(year from age(p.birth_date))::int = 1 then '1 año'
      else extract(year from age(p.birth_date))::int || ' años'
    end
  )
from public.pets p
where p.id = r.pet_id;

-- 3. Comprobar (después): debería bajar casi a 0 (queda lo que la mascota tampoco tiene)
select count(*) as alertas_incompletas
from public.reports r
join public.pets p on p.id = r.pet_id
where r.sex is null or r.breed is null or r.size is null or r.color is null
   or r.species_id is null or r.age_estimate is null;
