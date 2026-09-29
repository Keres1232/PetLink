# 07 — Decisiones de diseño (ADR-style)

> Cada decisión sigue el formato **Contexto → Decisión → Justificación → Alternativas
> descartadas**. Es la sección pensada para justificar "cada partecita" del diseño ante el
> jurado de tesis.

---

## ADR-01 — PostgreSQL + PostGIS como núcleo
**Contexto:** el producto depende de cercanía ("mascota perdida a 800 m de ti").
**Decisión:** toda la geografía vive en `geography(Point,4326)` con índices **GIST**.
**Justificación:** `ST_DWithin`/`ST_Distance` resuelven radio y orden por distancia dentro
del motor, en una sola consulta y con índice; no hay servicio de mapas en el camino crítico.
**Descartado:** calcular distancias en el cliente (traería toda la tabla) o un motor externo
(ElasticSearch geo) — sobrecoste innecesario para el volumen de la tesis.

## ADR-02 — Supabase como BaaS
**Contexto:** tesis con un solo desarrollador; se necesita auth, API, tiempo real y archivos.
**Decisión:** Supabase (Auth + PostgREST + Realtime + Storage + pg_cron) sobre el Postgres ya modelado.
**Justificación:** evita construir backend/API a mano sin renunciar a SQL propio; RLS cubre
autorización donde los datos viven. **Descartado:** Firebase (NoSQL, sin SQL relacional ni
PostGIS) y un backend Express propio (más superficie y tiempo).

## ADR-03 — RLS + RPC `SECURITY DEFINER` (nunca confiar en el cliente)
**Contexto:** cualquier código en el navegador es manipulable.
**Decisión:** autorización en BD: 65 políticas RLS + operaciones sensibles vía funciones con
validación y `auth.uid()` fijado en servidor.
**Justificación:** el atacante puede reescribir el JS, pero no las políticas; `create_alert`
inserta reporte+post de forma atómica marcando `user_id` real, imposible de suplantar.
**Descartado:** validaciones solo en React; service-role en el cliente (jamás).

## ADR-04 — Separar `profiles` y `private_profiles`
**Contexto:** nombre/rol son públicos; ubicación, consentimiento y documentos no.
**Decisión:** dos tablas 1:1; la sensible con RLS estricta solo-dueño.
**Justificación:** minimización de datos por diseño (Ley 1581): es imposible filtrar la
ubicación desde una consulta pública aunque una política se rompa, porque vive en otra tabla.
**Descartado:** una sola tabla con columnas por rol (una política mal escrita expone datos).

## ADR-05 — CHECK para estados cerrados, tablas para catálogos abiertos
**Contexto:** hay dominios fijos (estado de reporte) y abiertos (especies, tags).
**Decisión:** 22 CHECK en columnas para máquinas de estado cerradas; tablas catálogo para lo
que crece (con `approved` y `created_by`).
**Justificación:** el CHECK documenta y valida el dominio sin JOIN; los catálogos crecen sin
migración. **Descartado:** ENUMs de Postgres (rígidos para evolucionar) y solo-tablas para
todo (JOINs innecesarios para estados).

## ADR-06 — Notificaciones con triggers + cron (sin Edge Functions)
**Contexto:** hay que avisar geo-alertas, respuestas, likes y recordatorios.
**Decisión:** triggers `notify_on_report|comment|like` + job diario de recordatorios, con
bandeja persistida y Realtime.
**Justificación:** todo ocurre junto al dato (transaccional, imposible de saltar desde el
cliente) sin desplegar/mantener funciones edge; el costo y latencia son mínimos.
**Descartado:** Edge Function con push: más infraestructura sin beneficio en el alcance.

## ADR-07 — Alertas como publicaciones (`posts.report_id` 1:1)
**Contexto:** quien encuentra una mascota necesita comunicarse con el dueño.
**Decisión:** `create_alert` crea reporte **+** publicación pareada (única) `type='alert'`.
**Justificación:** comentarios, likes, Realtime y moderación ya existían para posts: se
reutiliza el 100 % en lugar de construir un chat del reporte; la conversación queda pública
y trazable (facilita la entrega). **Descartado:** comentarios polimórficos sobre `reports`
(duplicaría el stack social) y mensajería directa por defecto (los encuentros son públicos).

## ADR-08 — Moderación progresiva
**Contexto:** abrir la comunidad a todos invita a spam; frenar todo impide salvar mascotas.
**Decisión:** posts de usuario nacen `under_review` (trigger `force_post_review`), **las
alertas se publican al instante** (`report_id IS NOT NULL`), y la moderación es por roles.
**Justificación:** equilibrio seguridad/urgencia verificable por políticas; el admin no ve
cola por alertas. **Descartado:** moderación 100 % previa (mata la urgencia) o 100 % posterior
(riesgo de contenido en un producto con menores/usuario general).

## ADR-09 — Bitácora analítica genérica (`analytics_events`)
**Contexto:** la tesis mide interacción (p. ej. "No es mi zona" del Figma).
**Decisión:** `log_event(user_id, event_type, metadata jsonb)` + GIN + purga a 18 meses.
**Justificación:** métricas nuevas sin migraciones; JSONB para estructura variable; la purga
cumple retención. **Descartado:** columnas específicas por métrica (migración por cada idea).

## ADR-10 — Vista materializada del feed separada del OLTP
**Contexto:** el feed es la lectura más pesada; las escrituras deben seguir rápidas.
**Decisión:** `posts_feed_mv` refrescada cada 5 min `concurrently` vía pg_cron.
**Justificación:** separa lectura analítica del camino transaccional sin bloqueos.
**Descartado:** contar likes/comentarios en cada request (N+1 caro) — `get_feed` calcula
contadores por subconsulta sobre tablas indexadas; la MV es el amortiguador de escalado.

## ADR-11 — TypeScript progresivo sobre la base JS existente
**Contexto:** la base móvil existía en JS; el prompt de trabajo prohíbe romperla.
**Decisión:** `allowJs` + archivos nuevos `.tsx/.ts`; lo heredado se migra solo si hay razón.
**Justificación:** tipado donde se construye nuevo (contrato de datos en `types.ts`) sin un
refactor masivo arriesgado. **Descartado:** migrar todo de golpe (riesgo/inversión); seguir
en JS puro (pérdida de seguridad de tipos en la capa de datos).

## ADR-12 — Leaflet + OpenStreetMap + Nominatim
**Contexto:** mapa interactivo + ubicar lugares por texto, sin presupuesto.
**Decisión:** Leaflet con tiles OSM; Nominatim (inverso y directo) con throttle 1 req/s.
**Justificación:** costo cero, sin API keys, licencias abiertas; el throttle respeta la
política de uso. **Descartado:** Google Maps (key+billing), Mapbox (token), y geocodificar
con datos propios (innecesario).

## ADR-13 — Deep links por query params (sin páginas de detalle)
**Contexto:** notificaciones y tarjetas deben llevar "exactamente" al contenido.
**Decisión:** `?post=`, `?comment=`, `?report=` sobre las páginas existentes + scroll y
`flash-highlight`.
**Justificación:** cero rutas nuevas, misma UX de "abrir el contenido" y el estado ya cargado
del feed se reutiliza. **Descartado:** página de detalle de post/reporte (duplica UI y
navegación para el mismo resultado).

## ADR-14 — Mobile-first fiel al Figma + shell desktop real
**Contexto:** el diseño es móvil (iPhone 16) pero la web se usa en escritorio.
**Decisión:** tokens y tipografías exactas del Figma; bottom-nav en <1024 px y sidebar +
grids en ≥1024 px; safe-areas (`env(safe-area-inset-*)`) y `100dvh`.
**Justificación:** continuidad de marca móvil y ergonomía desktop (navegación lateral,
4 columnas) sin "encoger" la app; verificado sin overflow en 320/360/412 px.
**Descartado:** app móvil estirada (mala ergonomía en desktop) y re-diseñar desktop desde
cero (rompe la identidad visual de la tesis).

## ADR-15 — Grants mínimos (revoke de `anon`/`public`)
**Contexto:** Supabase auto-otorga EXECUTE a funciones nuevas.
**Decisión:** cada migración revoca y otorga explícitamente: app RPCs solo `authenticated`;
funciones de trigger, a nadie.
**Justificación:** superficie de ataque mínima verificable (`anon=✗` auditado en 33 funciones).
**Descartado:** confiar en el default del proveedor.

## ADR-16 — Buckets: público para comunidad, privado para documentos
**Contexto:** fotos alimentan UI pública; documentos de verificación son sensibles.
**Decisión:** `pet-photos` y `post-images` públicos (escritura autenticada), `vet-documents` privado.
**Justificación:** el contenido comunitario se sirve por CDN sin firmar URLs; los documentos
profesionales solo los ve quien corresponde. **Descartado:** todo privado (URLs firmadas
complican el feed) o todo público (exposición de documentos).

## ADR-17 — Fotos del reporte en `text[]` (no tabla hija)
**Contexto:** hasta 4 fotos por reporte, siempre leídas juntas.
**Decisión:** arreglo `photos text[]` con default `'{}'`.
**Justificación:** evita un JOIN por render y simplifica RLS; el máximo es pequeño y estable.
**Descartado:** tabla `report_photos` (JOIN y políticas extra sin beneficio real).

## ADR-18 — Fotos de mascota: `photo_url` principal + fotos auxiliares del reporte
**Contexto:** el Figma dice "La primera foto ya es la de Mati registrada. Puedes agregar
hasta 3 más recientes".
**Decisión:** `pets.photo_url` (retrato) + `reports.photos[]` (recientes del avistamiento).
**Justificación:** modela exactamente la semántica del diseño: el retrato identifica a la
mascota; las fotos del reporte contextualizan el momento de la pérdida.
**Descartado:** una sola colección de fotos (perdería la distinción).

## ADR-19 — Dependencias mínimas y justificadas
**Contexto:** el repo base solo tenía React + lucide-react.
**Decisión:** añadir 4 dependencias, cada una con motivo: `@supabase/supabase-js` (backend),
`react-router-dom` (URLs/deep links), `leaflet` + `react-leaflet` (mapa),
`typescript` (tipos). Sin Tailwind, sin Redux/Zustand, sin axios.
**Justificación:** el estado global es solo la sesión (Context); los estilos ya existían en
CSS con tokens; fetch nativo basta para Nominatim. **Descartado:** stacks completos
(material UI, state managers) que contradicen el "extender, no reemplazar" del prompt.

## ADR-20 — Errores de red humanizados en una capa
**Contexto:** los mensajes de Supabase llegan en inglés/técnicos.
**Decisión:** `AuthContext.translateAuthError` + mensajes por página ("No pudimos publicar…")
con `console.error` del error real.
**Justificación:** el usuario final entiende el mensaje; el desarrollador conserva el detalle
técnico en consola (equilibrio UX/depuración).
**Descartado:** mostrar el error crudo (confuso) u ocultarlo del todo (imposible depurar).
