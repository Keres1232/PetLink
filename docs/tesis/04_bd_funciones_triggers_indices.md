# 04 — Funciones, triggers, jobs, índices y restricciones

> Extraído en vivo del esquema (`pg_proc`, `pg_trigger`, `cron.job`, `pg_indexes`,
> `pg_constraint`). **33 funciones** (21 RPCs `SECURITY DEFINER` + 12 de trigger/cron),
> **9 triggers**, **3 jobs** `pg_cron`, **26 índices** secundarios + únicos, **22 CHECKs**.

## 4.1 RPCs de aplicación (invocables por el cliente autenticado)

| Función | Argumentos | Devuelve | Propósito y justificación |
|---|---|---|---|
| `create_alert` | pet_id, type, description, lat, lon, species_id, sex, breed, color, size, age_estimate, photos[], lost_at | uuid | **Corazón del flujo de reportes**: inserta el reporte *y su publicación pareada* (`posts.report_id`) en una sola transacción. Al ser `SECURITY DEFINER`, el usuario no necesita permiso de escritura directa sobre `posts` en ese contexto, y `user_id` se fija con `auth.uid()` (no se puede suplantar). |
| `reports_near` | lat, lon, radius_m | tabla | Reportes activos en radio con lon/lat + distancia + `post_id`. PostgREST no serializa `geography`, así que la función "aplana" PostGIS a tipos simples. LEFT JOIN a `pets` para que los **callejeros también aparezcan**. |
| `places_near` | lat, lon, radius_m, kind | tabla | Veterinarias/refugios en radio (filtro del mapa Figma). |
| `report_by_id` | id | fila | Un reporte con el shape de `reports_near` (deep link `/mapa?report=` desde alertas viejas). |
| `get_feed` | type, tag, cursor, limit | tabla | Feed paginado (keyset por `created_at`), solo `published`, con `author_name`, `tags[]`, contadores de comentarios/likes, `liked_by_me`, `report_id` y coordenadas. Evita N+1 consultas del cliente y centraliza la regla "no mostrar under_review". |
| `toggle_post_like` | post_id | bool | Like/unlike idempotente en una llamada (el cliente no decide el estado; lo determina la BD). Dispara la notificación al autor vía trigger. |
| `set_my_location` | lat, lon, radius | void | Persiste ubicación y radio del usuario en `private_profiles` (con consentimiento ya registrado). Fuente de las geo-alertas. |
| `search_guides` | q, species_id, limit | tabla | Buscador de guías validadas (pantalla Ayuda); devuelve validador y nº de fuentes. |
| `apply_as_vet` / `apply_as_foundation` | document_url | uuid | Solicitud de verificación con documento; la fundación solo puede pedir `kind='shelter'`. |
| `review_vet_application` | application_id, approved | void | Admin aprueba/rechaza; al aprobar actualiza `profiles.role/vet_status` de forma transaccional. |
| `create_clinic` | name, address, phone, lat, lon, kind | uuid | Vet verificado crea su página **pendiente de verificación** (nunca auto-verificada). |
| `verify_clinic` | clinic_id, approved | void | Admin verifica (con `verified_by/verified_at` para auditoría). |
| `update_appointment_status` | appointment_id, status | void | Clínica/dueño cambian estado de cita con validación de pertenencia. |
| `express_adoption_interest` / `respond_adoption_interest` | pet_id, message / interest_id, status | uuid / void | Flujo de adopción con múltiples interesados y respuesta del dueño. |
| `toggle_follow` | user_id | bool | Seguir/dejar de seguir en una llamada. |
| `moderate_post` / `moderate_comment` | id, status/hidden | void | Moderación con verificación de rol admin **dentro** de la función (defensa extra a RLS). |
| `get_moderation_queue` | status | tabla | Cola de moderación para admin (RLS de SELECT no dejaba leer posts de otros). |
| `report_comment` | comment_id, reason | uuid | Denuncia comunitaria de comentarios. |
| `log_event` | user_id, event_type, metadata | void | Registro genérico de analítica (p. ej. `alert_dismissed` del Figma) sin migrar esquema. |

**Patrón de diseño:** el cliente nunca hace validaciones de negocio críticas; las RPC
concentran reglas + transacciones, y **todas** tienen `EXECUTE` solo para `authenticated`
(doc 03 §3.4).

## 4.2 Funciones de trigger y cron (no invocables por API)

| Función | Disparador | Qué garantiza |
|---|---|---|
| `handle_new_user` | `AFTER INSERT auth.users` | Crea `profiles` + `private_profiles` al registrarse (nombre desde metadata o email). **Evita estado huérfano** si el cliente falla tras el signup. |
| `force_post_review` | `BEFORE INSERT posts` | Fuerza `under_review` a posts de no-admin… **excepto alertas** (`report_id IS NOT NULL`), que se publican al instante por urgencia. |
| `protect_post_moderation_status` | `BEFORE UPDATE posts` | Solo admin cambia `moderation_status` (el autor no puede auto-publicarse). |
| `protect_profile_role` | `BEFORE UPDATE profiles` | Nadie asciende su propio rol (`role/vet_status`) por API directa. |
| `notify_on_report` | `AFTER INSERT reports` | Crea `geo_alert` para usuarios con consentimiento y ubicación dentro de **su** radio (`alert_radius_m`). |
| `notify_on_comment` | `AFTER INSERT comments` | Crea `post_reply` al autor del post (excluye auto-respuesta). |
| `notify_on_like` | `AFTER INSERT post_likes` | Crea `post_like` al autor del post (excluye auto-like). |
| `sync_pet_status_from_report` | `AFTER INSERT/UPDATE reports` | Sincroniza `pets.status='lost'` al abrir y de vuelta a `active` al cerrar (si no quedan reportes abiertos). **Una sola fuente de verdad**. |
| `set_guide_validator` | `BEFORE INSERT/UPDATE symptom_guides` | Fuerza `validated_by = auth.uid()` y `validated_at = now()`: la validación médica queda atribuida. |
| `set_updated_at` | `BEFORE UPDATE private_profiles` | Mantiene `updated_at`. |
| `generate_pet_reminders` | cron diario | Crea `pet_reminder` para citas próximas. |

## 4.3 Jobs programados (`pg_cron`)

| Job | Horario | Comando | Justificación |
|---|---|---|---|
| Refresh del feed | `*/5 * * * *` | `refresh materialized view concurrently public.posts_feed_mv` | Mantiene fresca la vista materializada del feed (lectura pesada separada del OLTP) sin bloquear lectores (`concurrently`). |
| Purga de analítica | `0 3 * * 0` | `delete … > 18 months` | Retención de datos (Ley 1581) automática, domingos de madrugada. |
| Recordatorios | `0 8 * * *` | `select generate_pet_reminders()` | Recordatorios de mascotas (pantalla de notificaciones) a las 8 a.m. |

## 4.4 Estrategia de índices (26 secundarios)

| Grupo | Índices | Justificación |
|---|---|---|
| **Geoespaciales (GIST)** | `reports_location_idx`, `vet_clinics_location_idx`, `posts_location_idx` | `ST_DWithin` de `reports_near`/`places_near` y futuros filtros por zona; sin GIST las consultas serían escaneos secuenciales. |
| **Feed y moderación** | `posts_moderation_status_idx`, `posts_user_idx`, `comments_post_idx`, `post_likes_post_id_idx` | `get_feed` filtra `published` + ordena; comentarios/likes se agregan por post. |
| **Bandeja de notificaciones** | `notifications_user_created_idx` (DESC), `notifications_user_read_idx` | Bandeja ordenada por fecha y contador de no leídas (campana). |
| **Relaciones calientes** | `reports_pet_idx`, `reports_status_idx`, `pets_user_idx`, `appointments_user_idx`, `conversations_user_idx`, `conversations_clinic_idx`, `messages_conv_idx (conversation_id, created_at)`, `follows_following_idx`, `adoption_interests_pet_idx`, `comment_reports_comment_idx`, `comment_reports_status_idx`, `vet_applications_user_idx`, `vet_applications_status_idx`, `symptom_guides_species_idx` | Cada FK consultada en pantallas (mis mascotas, hilo de mensajes, cola admin…). |
| **Búsqueda JSONB** | `analytics_events_metadata_gin_idx` (GIN) | Consultas analíticas sobre `metadata` sin esquema fijo. |
| **Analítica** | `analytics_events_type_idx` | Métricas por tipo de evento. |
| **Vista materializada** | `posts_feed_mv_id_idx` (UNIQUE) | Requisito de `refresh … concurrently` + lookups por id. |
| **Unicidad de negocio** | `posts_report_id_key` (UNIQUE parcial `WHERE report_id IS NOT NULL`) | Garantiza el 1:1 reporte↔publicación. |

## 4.5 Restricciones CHECK (22) — "enums" del modelo

**Decisión:** máquinas de estado **cerradas** → CHECK en la propia columna; catálogos
**abiertos** (especies, tags) → tabla. Justificación: el CHECK documenta el dominio en el
esquema y evita joins para validar; la tabla permite crecer sin migración.

| Dominio | Restricción |
|---|---|
| Estados de mascota | `pets_status_check`: `active|lost|in_treatment|deceased|for_adoption|adopted` |
| Sexo / tamaño (pets y reports) | `sex ∈ male|female|unknown`, `size ∈ small|medium|large` |
| Tipos de publicación | `posts_type_check`: `post|meme|experience|question|tip|story|found|alert` |
| Moderación | `posts_moderation_status_check`: `published|under_review|rejected` |
| Reportes | `reports_type_check` (`lost|found|danger`), `reports_status_check` (`open|searching|resolved|closed`) |
| Notificaciones | `notifications_type_check`: `geo_alert|post_reply|pet_reminder|post_like` |
| Roles | `profiles_role_check` (`owner|vet|admin|foundation`) + `vet_status_requires_vet_role` |
| Aplicaciones | `vet_applications_status_check`, `vet_applications_target_role_check` (`vet|foundation`) |
| Clínicas | `vet_clinics_kind_check` (`clinic|shelter`) |
| Guías | `symptom_guides_urgency_level_check` (`mild|moderate|urgent|critical`) |
| Fuentes | `sources_type_check` |
| Citas | `appointments_status_check` |
| Adopción | `adoption_interests_status_check` (`pending|approved|rejected|withdrawn`) |
| Social | `follows_check`: `follower_id <> following_id` (no auto-seguirse) |
| Privacidad | `private_profiles_alert_radius_m_check`: 500–50 000 m |

## 4.6 Extensiones y vista materializada

- **Extensiones:** `postgis 3.3.7` (geo), `pg_cron 1.6.4` (jobs), `pgcrypto` (UUIDs/cripto),
  `pg_stat_statements` (observabilidad), `uuid-ossp`, `supabase_vault`.
- **`posts_feed_mv`** (materializada): copia desnormalizada del feed para lecturas masivas;
  se refresca cada 5 min. **Justificación:** separa la lectura pesada (feed) del OLTP
  (escrituras de reportes/mensajes), siguiendo el ADR 3.6 de `database_documentation.md`.
