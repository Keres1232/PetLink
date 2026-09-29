# 03 — Seguridad: RLS, roles y cumplimiento (Ley 1581)

> **Principio rector:** el navegador es hostil por definición. La autorización vive en la
> base de datos (RLS + funciones `SECURITY DEFINER`), nunca en el cliente. El cliente usa
> únicamente la clave **publishable**; jamás una service-role.

## 3.1 Modelo de tres capas

| Capa | Mecanismo | Qué protege | Ejemplo |
|---|---|---|---|
| 1. RLS (65 políticas) | `auth.uid()` + subconsultas de rol | Acceso fila/columna a las 25 tablas | `pets_insert_own` exige `user_id = auth.uid()` |
| 2. RPC `SECURITY DEFINER` | Validaciones de negocio en SQL | Operaciones sensibles multi-tabla | `create_alert` (reporte + publicación), `moderate_post` |
| 3. Triggers de protección | Blindan invariantes que RLS no puede | Campos que el dueño NO debe cambiar solo | `protect_profile_role`, `protect_post_moderation_status` |

**Justificación:** RLS por sí sola no puede expresar reglas como "nadie se auto-verifica como
veterinario" o "una alerta se publica al instante pero un post normal pasa a revisión"; los
triggers cierran esos huecos en el motor, no en el código de aplicación.

## 3.2 Patrones de política (los 6 que cubren las 65)

**P1 — Catálogos/lectura pública:**
`SELECT true` en `species`, `tags`, `profiles`, `pets`, `posts*`, `comments*`, `reports`,
`post_likes`, `follows`, `sources`, `guide_sources`, `symptom_guides`, `vet_clinics`,
`post_tags`. *Justificación:* la propuesta del producto es comunitaria y geolocalizada
(que cualquiera pueda ver una mascota perdida); el dato sensible no vive aquí.
`*` con filtro: `posts` solo `published` (o propio) y `comments` solo `is_hidden = false`
(o propio, o admin) → transparencia con moderación.

**P2 — Propiedad estricta (`auth.uid()` en USING y WITH CHECK):**
INSERT/UPDATE/DELETE propios en `pets`, `posts`, `comments`, `reports`, `appointments`,
`symptom_queries`, `notifications`, `analytics_events`, `user_interests`, `post_likes`,
`comment_reports`, `vet_applications`, `adoption_interests`. El **WITH CHECK** es clave:
impide que un usuario inserte una fila a nombre de otro (o la reasigne).

**P3 — Rol administrador (`role = 'admin'`):**
gestión total en `posts` (moderación), `comments`, `vet_clinics`, `vet_applications`,
`comment_reports`. *Justificación:* separación de funciones: solo el staff decide sobre
contenido y verificaciones, con trazabilidad (`verified_by`, `reviewed_by`).

**P4 — Veterinario verificado (`role='vet' AND vet_status='verified'`):**
`symptom_guides`, `sources`, `guide_sources`. *Justificación:* **propósito del módulo de
información confiable**: solo profesionales verificados escriben contenido de salud.
Además, `vet_clinics` permite INSERT/UPDATE al vet creador **solo mientras `verified = false`**
(WITH CHECK) → un vet no puede auto-verificarse su clínica.

**P5 — Participantes (mensajería):**
`conversations` y `messages` solo para el dueño del hilo o el vet de la clínica.
*Justificación:* privacidad de la comunicación; el Realtime respeta la misma RLS.

**P6 — Datos sensibles (Ley 1581):**
`private_profiles` es **estrictamente del dueño** (`auth.uid() = profile_id`) sin lectura
pública ni de otros usuarios. Aquí viven ubicación, consentimiento, radio, fecha de
nacimiento y documentos.

## 3.3 Resumen por tabla (políticas)

| Tabla | Politicas | Patrón | Quién puede qué |
|---|---|---|---|
| `species` | 1 | P1 | Lectura pública |
| `tags` | 1 | P1 | Lectura pública |
| `profiles` | 2 | P1+P2 | Lectura pública; el dueño edita su perfil (rol blindado por trigger) |
| `private_profiles` | 2 | P6 | Solo el dueño lee/edita |
| `pets` | 4 | P1+P2 | Lectura pública; CRUD solo del dueño |
| `posts` | 5 | P1+P2+P3 | Lectura `published`/propio; CRUD del autor; moderación admin |
| `comments` | 4 | P1+P2+P3 | Lectura si no oculto; CRUD propio; moderación admin |
| `post_tags` | 2 | P1+P2 | Lectura pública; etiquetar solo posts propios |
| `user_interests` | 1 | P2 | Solo el dueño (intereses del feed) |
| `reports` | 3 | P1+P2 | Lectura pública (rapidez); crear/editar solo el reportero |
| `vet_clinics` | 4 | P1+P3+P4 | Lectura pública; vet verificado crea/edita **pendiente**; admin verifica |
| `vet_applications` | 3 | P2+P3 | El solicitante ve/crea; admin revisa |
| `appointments` | 2 | P2+P5 | Dueño y clínica respectiva leen; estados vía RPC |
| `conversations` | 2 | P5 | Solo participantes |
| `messages` | 3 | P5 | Solo participantes (SELECT/INSERT/UPDATE lectura) |
| `symptom_guides` | 2 | P1+P4 | Lectura pública; escritura solo vet verificado |
| `sources` | 2 | P1+P4 | Lectura pública; escritura solo vet verificado |
| `guide_sources` | 2 | P1+P4 | Ídem |
| `symptom_queries` | 1 | P2 | Historial de triaje privado |
| `notifications` | 4 | P2 | Solo el dueño (leer/marcar leídas/borrar); inserts vía triggers |
| `post_likes` | 3 | P1+P2 | Grafo público; like/unlike solo propio |
| `comment_reports` | 3 | P2+P3 | El reportero ve lo suyo; admin gestiona |
| `follows` | 3 | P1+P2 | Grafo público; seguir/dejar de seguir propio |
| `adoption_interests` | 4 | P2 | El interesado ve/crea lo suyo; el dueño de la mascota ve/responde |
| `analytics_events` | 2 | P2 | Solo eventos propios (inserción/lectura) |

Catálogo exhaustivo con expresiones exactas → [`DATA_DICTIONARY.md`](../DATA_DICTIONARY.md) §3.

## 3.4 Endurecimiento de funciones (grants)

Supabase otorga `EXECUTE` a `anon`/`authenticated` por defecto en funciones nuevas.
Se revirtió explícitamente en migraciones `0012`, `0015`, `0017`, `0021`, `0025`, `0029`:

- **RPCs de app** (`create_alert`, `get_feed`, `reports_near`, `places_near`, `toggle_post_like`,
  `search_guides`, `report_by_id`, …): `EXECUTE` **solo `authenticated`**; `revoke` de `public` y `anon`.
- **Funciones de trigger** (`notify_*`, `force_post_review`, `handle_new_user`,
  `sync_pet_status_from_report`, …): `EXECUTE` revocado de **todos** (solo el motor las invoca).
- **Verificación en vivo:** 33 funciones auditadas; las de app con `authenticated=✓, anon=✗`.

*Justificación:* minimizar superficie de ataque; un usuario anónimo no puede crear alertas
ni leer endpoints internos, y los triggers no son invocables por API.

## 3.5 Storage (3 buckets)

| Bucket | Público | Uso | Política de inserción |
|---|---|---|---|
| `pet-photos` | Sí | Fotos de mascotas y reportes | `authenticated` únicamente |
| `post-images` | Sí | Imágenes de publicaciones | `authenticated` únicamente |
| `vet-documents` | **No** | Documentos de verificación vet/fundación | `authenticated` (solo el solicitante) |

*Justificación:* lectura pública solo de contenido comunitario; los documentos de identidad
profesional quedan privados. Los archivos se suben con ruta `{user_id}/{timestamp}-{nombre}`,
lo que hace el origen verificable y evita colisiones.

## 3.6 Cumplimiento Ley 1581 (Colombia) — justificación de diseño

| Principio | Implementación |
|---|---|
| **Consentimiento previo y expreso** | `private_profiles.geolocation_consent` se persiste al aceptar el permiso del navegador (hook `useUserLocation`); sin consentimiento no se lee GPS ni se recibe geo-alertas |
| **Finalidad limitada** | La ubicación solo alimenta `notify_on_report` (radio configurable 500–50 000 m) y `reports_near`/`places_near`; no se expone a otros usuarios |
| **Minimización** | Separación `profiles` (público) / `private_profiles` (sensible): el feed nunca toca datos privados |
| **Trazabilidad** | `analytics_events` registra eventos (p. ej. `alert_dismissed`); `verified_by/verified_at`, `reviewed_by` auditan acciones del staff |
| **Retención** | Job cron purga `analytics_events` > 18 meses (`0 3 * * 0`) |
| **Seguridad** | RLS en 25/25 tablas + RPC con validación server-side + grants endurecidos |
| **Derecho a retirar el consentimiento** | Perfil → Preferencias permite actualizar/negarlo; se refleja en BD y en el navegador |

## 3.7 Defensa en profundidad — ejemplo real documentado

Bug encontrado y corregido durante el desarrollo (auditoría E2E): los embeds
`author:profiles(name)` desde `posts` eran **ambiguos** (PGRST201: FK directa `user_id`
+ m2m vía `post_likes`). Se corrigió en cliente con *hints* de FK
(`profiles!posts_user_id_fkey`). **Lección de diseño:** aunque el dato era público, la
consulta fallaba; se validó con usuario real vía REST antes de dar por buena la
integración — evidencia de que la verificación end-to-end es parte del diseño seguro.
