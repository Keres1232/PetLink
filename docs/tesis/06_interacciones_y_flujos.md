# 06 — Interacciones y flujos end-to-end

> Cada flujo describe: **actor → pasos en la interfaz → operaciones en la base de datos →
> resultado visible** y la *justificación de la interacción* (por qué se diseñó así).

---

## 6.1 Registro y sesión

**Actor:** visitante.

1. `/registro` → nombre, correo, contraseña, aceptación de términos → `supabase.auth.signUp`
   con `options.data = { name }`.
2. Supabase envía enlace de confirmación (**seguridad**: no hay sesión hasta confirmar; la
   UI lo comunica: "¡Cuenta creada exitosamente! Revisa tu correo…").
3. Trigger `handle_new_user` crea `profiles` (rol `owner`) y `private_profiles` en la misma
   transacción del alta → **nunca hay usuario sin perfil**.
4. `/login` → `signInWithPassword` → `AuthContext` guarda la sesión (persistida en
   localStorage con auto-refresh) y carga el perfil.
5. Rutas protegidas: sin sesión → `/login`; con sesión, `/login` y `/registro` redirigen a `/`.

*Justificación:* autenticación 100 % delegada a Supabase Auth (no se reinventa), con perfil
de negocio separado y creado por el motor para evitar estados inconsistentes.

## 6.2 Inscribir mascota

**Actor:** dueño. **Ruta:** `/mascotas/nueva` (Figma `2260:1472`).

1. Foto (modal cámara/galería) → se sube a `pet-photos` con ruta `{user_id}/{ts}-{archivo}`.
2. Especie (chips desde `species`), sexo, nombre, raza, edad (`birth_date`), color, tamaño,
   señas (`description`).
3. `createPet` → INSERT en `pets` con `user_id = auth.uid()` (RLS `pets_insert_own`).
4. Redirección a `/perfil` con la card de la mascota (foto real).

*Justificación:* la nota del Figma —*"Esta información se usará para generar la alerta
automática si algún día reportas a tu mascota como perdida"*— se cumple porque el formulario
de pérdida reutiliza estos datos (selector de mascota con su foto).

## 6.3 Crear una alerta (flujo central)

**Actor:** dueño o testigo. **Ruta:** `/reportar` (selector, Figma `2417:1339`).

### 6.3.1 "Se perdió mi mascota" (`/reportar/mi-mascota`, Figma `2421:1572`)
1. Selecciona su mascota (`PetSelectCard`) o "No está en la lista".
2. Lugar: texto + "Usar mi ubicación actual" + clic en mini-mapa; **geocodificación inversa**
   (Nominatim) propone el nombre del lugar.
3. Características al momento de perderse, hasta 3 fotos adicionales, fecha y hora aprox.
4. `create_alert(p_pet_id, 'lost', …, photos[ ], lost_at)`:
   - INSERT en `reports` (PostGIS `geography`).
   - INSERT en `posts` con `type='alert'`, `report_id` único, **`moderation_status='published'`**.
   - Trigger `sync_pet_status_from_report` → `pets.status='lost'`.
   - Trigger `notify_on_report` → `geo_alert` a cada usuario con consentimiento cuya
     `alert_radius_m` cubra el punto (`ST_DWithin`).
5. La app redirige **a la publicación** (`/comunidad?post=…`).

### 6.3.2 "Encontré una mascota" (`/reportar/encontrada`, Figma `2429:2143`)
Igual que 6.3.1 pero `pet_id = NULL` y con atributos del callejero (especie, sexo, edad
aprox., tamaño, raza, descripción, fotos). *Justificación:* permite reportar animales **sin
dueño registrado**; `reports_near` los muestra igual (LEFT JOIN).

**Justificación del flujo completo:** una alerta debe ser inmediata (sin cola de moderación)
y **convertirse en publicación** para que quien encuentre a la mascota comente y coordine la
entrega sin canales externos.

## 6.4 Interacción sobre la alerta (entrega de la mascota)

1. Cualquier usuario ve la alerta en Home ("Cerca de ti"), Mapa o Comunidad (chip **Alertas**).
2. Comenta en la publicación ("La vi en el parque X, puedo cuidarla hasta que la reclamen").
3. Trigger `notify_on_comment` → notificación `post_reply` **al dueño**; Realtime la muestra
   al instante; el dueño toca y el deep link abre **el post con su comentario resaltado**.
4. Puede dar like (`toggle_post_like` → `notify_on_like` al autor) y usar "Ver en mapa"
   (deep link `/mapa?report=`).
5. Cuando se resuelve, el dueño/equipo cambia `reports.status` → `resolved` → trigger
   `sync_pet_status_from_report` devuelve la mascota a `active`.

*Justificación:* reutilizar la infraestructura social (comentarios/likes/Realtime ya
existentes para posts) evita duplicar chat genérico y mantiene la conversación **pública y
trazable** en el contexto de la alerta; el ajuste 1:1 `posts.report_id` lo garantiza.

## 6.5 Notificaciones navegables

**Ruta:** `/notificaciones` (bandeja con Realtime; estado vacío Figma).

| Tipo | `reference_id` | Al tocar |
|---|---|---|
| `geo_alert` | reporte | Resuelve el post del reporte → `/comunidad?post=…`; fallback `/mapa?report=…` |
| `post_like` | post | `/comunidad?post=…` |
| `post_reply` | comentario | Busca el comentario → `/comunidad?post=…&comment=…` (comentario resaltado) |
| `pet_reminder` | — | `/perfil` |

Al hacer clic: se marca `is_read` y se navega; el destino hace scroll y aplica
`flash-highlight` (pulso lila 2.2 s) al elemento. **Fallbacks a prueba de errores**: si la
resolución falla, siempre hay un destino razonable (nunca "no pasa nada").

*Justificación:* una notificación sin acción es ruido; el deep link cierra el ciclo
"aviso → contenido" y el resaltado resuelve el problema de "ya cargué la pantalla, ¿dónde está?".

## 6.6 Comunidad

**Ruta:** `/comunidad` (Figma `2245:912`).

1. **Filtrar** con chips: Todo / Preguntas / Consejos / Historias / Encontradas / **Alertas**
   → `get_feed(p_type)` (una RPC por filtro; servidor filtra, no el cliente).
2. **Publicar**: tipo (Pregunta/Consejo/Historia/Encontrada/Post) + texto + imagen opcional
   (`post-images`). Los posts de usuario entran `under_review` (moderación preventiva);
   el admin publica desde su panel. *Justificación:* cuidar la comunidad sin frenar alertas.
3. **Like** → `toggle_post_like` (la BD decide like/unlike; PK compuesta impide duplicados)
   y notificación al autor.
4. **Comentar** → `comments` (Realtime): el panel se abre bajo el post y los nuevos
   comentarios aparecen en vivo (`postgres_changes` con deduplicación por id).

## 6.7 Mapa

**Ruta:** `/mapa` (Figma `2108:1565`).

1. Carga punto + radio del usuario (`useUserLocation` → `private_profiles`).
2. `reports_near` (marcadores rojo=perdido, azul=encontrado) y `places_near`
   (ámbar=veterinaria, verde=refugio) dentro del radio; lista "Cerca de ti" con distancia
   (`1.2 km`) y antigüedad (`HOY`).
3. Filtros: Todo / Perdidas / Encontradas / Veterinarias / Refugios (filtrado local sobre
   datos ya cargados; reduce round-trips).
4. Tocar una fila abre **la publicación** del reporte; tocar el marcador enfoca el mapa.
5. Veterinarias con teléfono muestran botón de llamada (`tel:`) — Figma "Abierto 24 horas".

## 6.8 Adopción (estado actual)

- Home muestra `pets.status = 'for_adoption'` con badge Adopción.
- BD soporta el ciclo completo: `adoption_interests` (múltiples interesados) y
  `respond_adoption_interest` (el dueño aprueba → `pets.status='adopted'`).
- La UI de interés se ejercitó en `web-test`; su traslado a la web final queda como trabajo
  futuro (la BD ya está lista, doc 07 — ADR de alcance).

## 6.9 Cuenta y seguridad

1. **Cambiar correo:** contraseña actual (re-auth) + nuevo correo → Supabase envía enlace de
   confirmación al nuevo correo; **el cambio no aplica hasta confirmar** (mismo texto del
   Figma `2279:1844`).
2. **Cambiar contraseña:** re-auth + nueva (validación: mín. 6, coincidencia) +
   `signOut({ scope: 'others' })` → "cerramos sesión en tus otros dispositivos".

*Justificación:* re-autenticación previa = no basta un equipo desatendido; y cerrar otras
sesiones mitiga tokens robados.

## 6.10 Ayuda

`/ayuda` (Figma `2285:2181`): buscador que filtra **10 FAQ** locales (flujos reales:
reportes, adopción, cuenta, moderación) y, con ≥3 caracteres, consulta `search_guides`
(debounce 350 ms) mostrando guías validadas con su nivel de urgencia y validador.

## 6.11 Privacidad de ubicación (transversal)
1. Primer uso (Home): si el navegador no tiene decisión previa, se pide el permiso
   (una sola vez; `hasGeoDecision` evita repetir).
2. Aceptar → `geolocation_consent = true` en `private_profiles` + `set_my_location(punto, radio)`.
3. Rechazar → fallback Bogotá centro; la app funciona sin GPS (alertas por ciudad).
4. Perfil → Preferencias: actualizar radio (500–50 000 m) o volver a pedir ubicación.

*Justificación:* consentimiento explícito, granular y revocable; el radio decide qué
notificaciones se generan (`notify_on_report` lo usa en el `ST_DWithin`).

## 6.12 Panel de administración

**Ruta:** `/admin` (guardia `AdminArea`: `profile.role === 'admin'`; cualquier otro rol es
redirigido a `/`).

1. Cuatro colas con contador en pestañas: **Publicaciones** (`get_moderation_queue` →
   `moderate_post`: publicar/rechazar), **Solicitudes vet** (`vet_applications` →
   `review_vet_application`), **Clínicas pendientes** (`verify_clinic`),
   **Denuncias de comentarios** (`comment_reports` → `moderate_comment` +
   `resolve_comment_reports`).
2. Cada acción muestra estado de envío (`busyId`) y aviso de resultado
   (`notice`/`actionError`), y refresca la cola.

*Justificación:* una sola pantalla para todo el trabajo de staff; **cada acción invoca una
RPC que revalida el rol en el servidor** (defensa en profundidad: ocultar la ruta no es
seguridad; la BD vuelve a comprobar).
