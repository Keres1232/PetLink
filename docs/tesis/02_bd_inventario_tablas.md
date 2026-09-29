# 02 — Inventario de tablas (25)

> Todas las tablas tienen **RLS habilitado** (25/25), claves primarias `uuid` con
> `gen_random_uuid()` y `created_at timestamptz default now()` salvo excepciones
> indicadas. Total: **45 claves foráneas**, **56 índices**, **65 políticas RLS**.
> Diccionario columna por columna: [`DATA_DICTIONARY.md`](../DATA_DICTIONARY.md).

Módulos: **A** identidad · **B** mascotas · **C** reportes · **D** comunidad ·
**E** información validada · **F** servicios · **G** adopción · **H** notificaciones · **I** analítica.

---

## A. Identidad

### 2.1 `profiles` (5 columnas) — identidad pública
`id` (= `auth.users.id`), `name`, `role` (`owner|vet|admin|foundation`), `vet_status`
(`pending|verified|revoked`), `created_at`.

- **Se crea automáticamente** con el trigger `handle_new_user` al registrarse en Supabase Auth,
  tomando el nombre de `raw_user_meta_data->>'name'` (el registro de la app lo envía).
- **Justificación:** separa la identidad de negocio de `auth.users` (propiedad de Supabase Auth)
  permitiendo RLS por rol sin tocar tablas de sistema. El CHECK
  `vet_status_requires_vet_role` impide estados de verificación en usuarios normales.

### 2.2 `private_profiles` (7 columnas) — datos sensibles aislados
`profile_id` (PK/1:1), `location geography(Point)`, `geolocation_consent`,
`alert_radius_m` (500–50000), `support_document_url`, `birth_date`, `updated_at`.

- **Justificación (Ley 1581):** el aislamiento físico de ubicación, consentimiento y
  documentos permite **minimización de datos**: las consultas públicas de `profiles` no
  pueden filtrar coordinates aunque una política se escriba mal. El consentimiento y el
  radio se persisten aquí porque son la **evidencia trazable** del permiso del usuario.

---

## B. Mascotas

### 2.3 `species` (5) — catálogo de especies
`id`, `name` (único), `approved`, `created_by`, `created_at`.

- **Justificación:** catálogo extensible (Perro, Gato… y los que la comunidad proponga y un
  admin apruebe) en lugar de un ENUM fijo; la web lo consume por chips en formularios.

### 2.4 `pets` (13) — mascotas del usuario
`id`, `user_id`, `species_id`, `name`, `status` (`active|lost|in_treatment|deceased|for_adoption|adopted`),
`photo_url`, `description` (señas particulares), `birth_date` (edad derivada en UI),
`sex` (`male|female|unknown`), `breed`, `color`, `size` (`small|medium|large`), `created_at`.

- **Justificación:** los campos `sex/breed/color/size/description/birth_date` se añadieron
  (`0024`, `0025`) para cubrir 1:1 la pantalla Figma *"Inscribe tu mascota v2"*; el estado
  `lost` **se sincroniza automáticamente** desde `reports` (trigger `sync_pet_status_from_report`),
  evitando doble fuente de verdad.

---

## C. Reportes

### 2.5 `reports` (17) — alertas de mascotas perdidas/encontradas
`id`, `pet_id` (**nullable**), `user_id`, `type` (`lost|found|danger`),
`status` (`open|searching|resolved|closed`), `description`, `location geography`,
`created_at`, `resolved_at`, y los atributos de animal callejero añadidos en `0025`:
`species_id`, `sex`, `breed`, `color`, `size`, `age_estimate`, `photos text[]`, `lost_at`.

- **Justificación:**
  - `pet_id` nullable (`0027`): una mascota **encontrada en la calle** no está registrada;
    el reporte se describe por sus propios atributos.
  - `photos[]` (y no una tabla hija): máximo 4 fotos por reporte, se leen siempre juntas;
    un arreglo evita un JOIN y simplifica RLS.
  - `lost_at` separado de `created_at`: el dueño puede reportar horas después; el dato
    relevante para búsqueda es *cuándo se perdió*, no cuándo se publicó.
  - Ciclo `open→searching→resolved/closed`: máquina de estados cerrada → CHECK (ver doc 07).

---

## D. Comunidad

### 2.6 `posts` (10) — publicaciones (incluye alertas)
`id`, `user_id`, `pet_id`, `type` (`post|meme|experience|question|tip|story|found|alert`),
`content`, `image_url`, `location`, `moderation_status` (`published|under_review|rejected`),
**`report_id` (FK única a `reports`)**, `created_at`.

- **Justificación clave (`0029`):** cada alerta genera **un post pareado 1:1**
  (`report_id` único). Así comentarios, likes, Realtime y moderación de comentarios se
  reutilizan **sin duplicar infraestructura**: la alerta es una publicación con la que la
  comunidad interactúa para coordinar la entrega de la mascota.
- `type` cubre los chips del Figma v2 (Preguntas/Consejos/Historias/Encontradas) + `alert`.
- `moderation_status`: los posts de usuario nacen `under_review` (moderación preventiva);
  las alertas se publican al instante (urgencia) — ver `force_post_review` en doc 04.

### 2.7 `comments` (6) — respuestas a publicaciones
`id`, `post_id`, `user_id`, `text`, `is_hidden`, `created_at`.

- **Justificación:** `is_hidden` permite moderación sin borrar (auditoría) y ocultar
  solo a la vista pública; Realtime habilitado para respuestas en vivo.

### 2.8 `post_likes` (3) — me gusta
`post_id` + `user_id` (PK compuesta), `created_at`.

- **Justificación:** PK compuesta = un like por usuario/post a nivel de motor (idempotencia
  garantizada por la BD, no por el cliente); trigger `notify_on_like` avisa al autor.

### 2.9 `tags` (4) / 2.10 `post_tags` (2) / 2.11 `user_interests` (2)
Taxonomía de temas (`name`, `category`, `approved`) con relación N:N a posts y a perfiles
(intereses para personalizar el feed). **Justificación:** el modelo normaliza la
clasificación (evita texto libre) y habilita filtrado `get_feed(p_tag)`.

### 2.12 `follows` (3) — grafo social
`follower_id`, `following_id`, `created_at`; CHECK `follower_id <> following_id`.

- **Justificación:** el CHECK evita auto-seguimiento a nivel de BD (integridad de negocio
  garantizada por el motor); índice para ambos sentidos del grafo.

### 2.13 `comment_reports` (6) — denuncias de comentarios
`comment_id`, `reporter_id`, `reason`, `status` (`pending|reviewed|dismissed`),
`reviewed_by`, `created_at`. **Justificación:** flujo de moderación reportado por la
comunidad con trazabilidad del revisor (`reviewed_by` auditoría).

---

## E. Información validada (diferenciador de la tesis)

### 2.14 `sources` (5) — evidencia bibliográfica
`title`, `url`, `type` (`scientific_article|vet_website|book|other`), `created_by`, `created_at`.

### 2.15 `symptom_guides` (8) — guías de síntomas validadas
`symptom`, `species_id`, `recommendation`, `urgency_level` (`mild|moderate|urgent|critical`),
`validated_by`, `validated_at`, `created_at`, `created_by`.

### 2.16 `guide_sources` (2) — N:N guía↔fuente
### 2.17 `symptom_queries` (8) — consultas de triaje de usuarios

- **Justificación del módulo:** la propuesta de valor "información confiable" exige que toda
  guía de salud sea **trazable a fuentes** (`guide_sources`) y **validada por un veterinario**
  (`validated_by`, protegido por trigger `set_guide_validator`). El público puede leer; solo
  veterinarios verificados/admin escriben (RLS).

---

## F. Servicios (directorio + mensajería)

### 2.18 `vet_clinics` (11) — veterinarias y refugios
`id`, `name`, `address`, `phone`, `location geography`, `kind` (`clinic|shelter`),
`verified`, `created_by`, `verified_by`, `verified_at`, `created_at`.

- **Justificación:** `kind` (en lugar de tabla `shelters` separada) permite al mapa y al
  filtro Figma *Refugios* consultar **el mismo índice geográfico**; `created_by/verified_by`
  habilitan el flujo "un vet crea su página y un admin la verifica" con auditoría.

### 2.19 `vet_applications` (8) — solicitudes de verificación
`solicitante`, `target_role` (`vet|foundation`), `document_url`, `status` (`pending|approved|rejected`),
`reviewed_by`, `created_at`… **Justificación:** separa *solicitar* de *ser verificado*,
con documento soporte obligatorio (`vet-documents`, bucket privado).

### 2.20 `appointments` (7) — citas veterinarias
`pet_id`, `clinic_id`, `owner_id`, `scheduled_at`, `status` (`scheduled|completed|cancelled`), `notes`.

### 2.21 `conversations` (4) + 2.22 `messages` (6) — mensajería dueño↔clínica
- **Justificación:** modelo conversación+mensajes estándar (evita hilos sueltos), con RLS de
  participantes y Realtime por canal; las citas se listan tanto para dueño como para la clínica
  (dos políticas de lectura, doc 03).

---

## G. Adopción

### 2.23 `adoption_interests` (6) — interesados en adoptar
`pet_id`, `interested_user_id`, `message`, `status` (`pending|approved|rejected|withdrawn`),
`responded_by`, `created_at`.

- **Justificación:** separar la intención del cambio de estado de la mascota permite
  **múltiples interesados** con seguimiento individual y responde al flujo v1 (`pets.status`
  `for_adoption/adopted` muta solo cuando el dueño aprueba — RPC `respond_adoption_interest`).

---

## H. Notificaciones

### 2.24 `notifications` (8) — bandeja de notificaciones
`id`, `user_id`, `type` (`geo_alert|post_reply|pet_reminder|post_like`), `title`, `body`,
`reference_id` (a qué entidad apunta), `is_read`, `created_at`.

- **Justificación:**
  - Se persisten en BD (no push volátil) → la campana tiene historial y estado leído.
  - `reference_id` habilita **deep links**: el frontend resuelve el destino al hacer clic
    (reporte→publicación, comentario→post, like→post, recordatorio→perfil).
  - Se generan por triggers (reporte/reply/like) y cron (recordatorios), sin Edge Functions
    (costo/simplicidad justificados en doc 07). Realtime habilitado.

---

## I. Analítica

### 2.25 `analytics_events` (5) — bitácora genérica de eventos
`id`, `user_id`, `event_type`, `metadata jsonb`, `occurred_at` (+índices).

- **Justificación:** un log **genérico** (`log_event(event_type, metadata)`) permite agregar
  métricas nuevas sin migrar el esquema (p. ej. `alert_dismissed` del Figma). Retención
  de 18 meses por job cron (cumple minimización sin perder el histórico de tesis).
