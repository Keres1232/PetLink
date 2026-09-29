# 08 — Trazabilidad Figma → implementación

> Fuente de verdad visual: **Figma**. Este documento mapea cada pantalla/nodo al código y a
> los datos. El análisis exhaustivo pantalla-por-pantalla está en
> [`FIGMA_SCREEN_REVIEW.md`](../FIGMA_SCREEN_REVIEW.md) (§1–§6).

## 8.1 Versiones del archivo Figma

| Versión | Archivo | Aporte |
|---|---|---|
| v1 | `pMzCpdMfmq90FKiiK3XgUe` | Pantallas base: Home, alerta geo, Notificaciones, Mapa, componentes `card` y `ETIQUETA`, grids de imágenes |
| v2 | `1H16RzUO5IkUyIIjh1DZcF` | **User flow completo** (20 pantallas con flechas), login/registro reales, estados de carga, sets de componentes (Mapa, Comunidad, Cards, Home, Barra_inf) |
| v3 | `JMF96mNe0fM2xBKCvpRHMp` | Flujos de reporte (selector + perdida + encontrada), inscripción v2, comunidad v2 con chips, cambio de correo/contraseña, ayuda y soporte, modal de foto |

## 8.2 Mapa pantalla → ruta → datos (versión final v3)

| Nodo Figma | Pantalla | Ruta | Datos / funciones |
|---|---|---|---|
| `2417:1339` | Selector "¿Qué quieres reportar?" | `/reportar` | — (navegación) |
| `2421:1572` | Se perdió mi mascota | `/reportar/mi-mascota` | `myPets`, `create_alert`, `uploadPhotos`, Nominatim |
| `2429:2143` | Encontré una mascota (callejero) | `/reportar/encontrada` | `listSpecies`, `create_alert` (sin `pet_id`), `uploadPhotos` |
| `2444:2526` | Modal "Agregar foto" (cámara/galería) | `PhotoPickerModal` | input `capture="environment"` |
| `2444:2696` | `Card_mascotas` (selector de mascota) | `PetSelectCard` | `pets` |
| `2260:1472` | Inscribir mascota v2 | `/mascotas/nueva` | `species`, `createPet`, bucket `pet-photos` |
| `2245:912` | Comunidad v2 (chips + feed) | `/comunidad` | `get_feed(p_type)`, `toggle_post_like`, `comments` Realtime |
| `2105:406` | Home (saludo, alerta, secciones) | `/` | `reports_near`, `get_feed`, `pets for_adoption` |
| `2105:902` | Mapa (filtros + cerca de ti) | `/mapa` | `reports_near`, `places_near`, Leaflet |
| `2105:646` / `2117:452` | Notificaciones (vacío / detalle) | `/notificaciones` | `notifications` + Realtime + deep links |
| `2105:684` | Login "Bienvenido a PetClue" | `/login` | `signInWithPassword` |
| `2105:786` | Registro "Crea tu cuenta" | `/registro` | `signUp` + `handle_new_user` |
| `2106:1202` | Alerta "¡Cuenta creada exitosamente!" | aviso en `/registro` | — |
| `2279:1844` | Cambiar correo | `/configuracion/correo` | re-auth + `updateUser({email})` |
| `2279:1989` | Cambiar contraseña | `/configuracion/contrasena` | re-auth + `updateUser` + `signOut(others)` |
| `2285:2181` | Ayuda y soporte | `/ayuda` | FAQ + `search_guides` |
| `2016:214` | `Barra_inf` (5 secciones) | `NavBar` (mobile) + sidebar (desktop) | — |
| `97:119` / `2016:213` | `card` / `Card2` | `PetCard` | `reports`/`pets` |
| `2059:274` | `Foro` | `ForumPost` | `get_feed` |
| `2016:216` | `Notificaciones_recientes` | `AlertNotification` | `reports_near` (más cercano `lost`) |
| `131:93` | `ETIQUETA` (PERDIDO/ENCONTRADO/GATO/VET/REFUGIO…) | `StatusTag` + tokens de badges | `reports.type`, `pets.status`, `species`, `vet_clinics.kind` |

## 8.3 Tokens y tipografías tomados del Figma

| Elemento Figma | Token CSS |
|---|---|
| Fondo lavanda | `--pc-bg: #ede7fa` |
| Acento `#AE77FF` (botones/nav activo) | `--pc-primary` |
| Texto `#7519FF` (títulos del login) | `--pc-primary-strong` |
| Inputs morados | `--pc-input: #e3dcf6` |
| Texto secundario `#66557E` | `--pc-muted` |
| Badges PERDIDO / VET / REFUGIO / PREGUNTA | `--pc-lost`, `--pc-vet`, `--pc-shelter`, `--pc-question` |
| Títulos (Kodchasan 700) | `--pc-font-display` (Google Fonts) |
| Cuerpo (Nata Sans 400–700) | `--pc-font-body` (Google Fonts) |

## 8.4 Notas de fidelidad (decisiones de interpretación)

1. **Marca:** el login dice "PetClue" y el registro decía "de PetLink" → se unificó a
   **PetClue** (dominio `petclue.co`).
2. **Anotaciones de Figma:** los rectángulos rojos/naranjas son marcas de revisión, no
   elementos de diseño; no se implementaron.
3. **Textos dinámicos:** las cards del Figma muestran textos de ejemplo cortos ("Nombre",
   "Parque Usaquén · hoy"); la web muestra datos reales → los estilos se volvieron fluidos
   con **ellipsis** y wrap para no romperse (corregido tras prueba visual).
4. **Navegación:** el Figma es 100 % móvil. El desktop se derivó con la misma paleta y
   componentes, cambiando bottom-nav por **sidebar** (ver ADR-14).
5. **Alerta roja:** el texto de ejemplo del Figma es más corto que el real; la tarjeta se
   rediseñó fluida (crédito al hallazgo de la prueba en dispositivo).

## 8.5 Pendientes declarados por el propio Figma

El texto `2117:1115` del archivo v2 dice: *"Hacer alertas · User flow admin · Interfaz admin ·
User flow vet · Interfaz vet"*. Es decir, **los flujos de administración y veterinaria aún
no tienen diseño**.

**Estado:** la **base de datos ya los soporta completos** (roles `vet/foundation/admin`,
`vet_applications`, `verify_clinic`, `conversations/messages`, moderación, `appointments`).
Además, **ambas interfaces están implementadas en la web**:

- **Interfaz admin** (`/admin`, acceso solo por rol) con 4 colas: moderación de
  publicaciones (aprobar/rechazar), solicitudes de veterinario/fundación (revisar con
  documento), verificación de clínicas y denuncias de comentarios.
- **Flujo profesional** (`/verificacion` + `/mi-clinica`): solicitud con documento privado y
  gestión de la propia clínica/refugio, publicada en el mapa solo tras la verificación admin
  (migraciones `0030`/`0031`).

Los flujos funcionales cubren lo que el Figma aún no diseña visualmente (el *look* final del
flujo vet queda como trabajo de diseño futuro; la funcionalidad está operativa y documentada
en el doc 06 §6.13).
