# 05 — Inventario del frontend (interfaz, componentes y diseño)

> Repo `Keres1232/PetLink`, rama `web-development`. React 19 + Vite 8, JS/TS progresivo.
> Fuente de verdad visual: Figma (ver doc 08). Verificado con E2E real (Playwright + Edge)
> en 320 / 360 / 412 px: **cero overflow horizontal** y bottom-nav completa.

## 5.1 Rutas (14) y páginas

| Ruta | Página | Tipo | Datos que consume |
|---|---|---|---|
| `/login` | `LoginPage` | Pública | `supabase.auth.signInWithPassword` |
| `/registro` | `RegisterPage` | Pública | `signUp` con metadata `{name}` → trigger `handle_new_user` |
| `/` | `HomePage` | Protegida | `reports_near`, `get_feed`, `pets(for_adoption)`, campana propia (contador no leídas) |
| `/mapa` | `MapPage` | Protegida | `reports_near`, `places_near`, `report_by_id` (deep link), Leaflet/OSM |
| `/reportar` | `ReportPage` | Protegida | Selector de flujo (Frame 21) |
| `/reportar/mi-mascota` | `MiPetReportPage` | Protegida | `myPets`, `create_alert`, `uploadPhotos`, `searchPlace` (Nominatim) |
| `/reportar/encontrada` | `FoundPetReportPage` | Protegida | `listSpecies`, `create_alert`, fotos, geocodificación |
| `/comunidad` | `CommunityPage` | Protegida | `get_feed(p_type)`, `toggle_post_like`, `comments` + Realtime, deep links `?post`/`?comment` |
| `/notificaciones` | `NotificationsPage` | Protegida | `notifications` + Realtime, `markNotificationRead`, resolución de deep links |
| `/perfil` | `ProfilePage` | Protegida | `myPets`, `useUserLocation` (radio/consentimiento), `signOut` |
| `/mascotas/nueva` | `PetFormPage` | Protegida | `listSpecies`, `createPet`, `uploadPhoto` (pet-photos) |
| `/configuracion/correo` | `ChangeEmailPage` | Protegida | Re-auth + `updateUser({email})` (confirmación por enlace) |
| `/configuracion/contrasena` | `ChangePasswordPage` | Protegida | Re-auth + `updateUser({password})` + `signOut({scope:'others'})` |
| `/ayuda` | `AyudaPage` | Protegida | FAQ local + `search_guides` (debounce 350 ms) |
| `*` | — | — | Redirige a `/` |

**Rutas protegidas:** `ProtectedArea` (redirige a `/login` sin sesión) y `PublicArea`
(redirige a `/` con sesión) en `App.tsx`. *Justificación:* una sola guardia componiendo el
layout evita parpadeos de UI y protege todas las hijas a la vez.

## 5.2 Componentes

### 5.2.1 Reutilizados de la base móvil (con extensiones mínimas)

| Componente | Uso en web | Extensión realizada |
|---|---|---|
| `NavBar` | Bottom-nav móvil (5 secciones + contador) | Se incrusta en el layout; máx-ancho liberado |
| `PetCard` | Cards de reportes/adopción/perfil | Props `photoUrl`, `onClick`; layout fluido + ellipsis |
| `ForumPost` | Publicaciones de la comunidad | Props `liked`/`onLike` (botón real accesible) |
| `AlertNotification` | Tarjeta roja de alerta geo en Home | Layout fluido (antes medidas fijas de Figma) |
| `LoginCard` / `RegisterCard` | Formularios de acceso | Callback `onSubmit` (antes `console.log`); rebrand PetClue |
| `FormField`, `PrimaryButton`, `RememberForgotRow`, `StatusTag`, `VetCard`, `PawHeartLogo` | Base visual Figma | Sin cambios funcionales |
| `AuthHeader`, `AuthScreen`, `LoginScreen`, `RegisterScreen` | No usados por las rutas web | Se conservan (compatibilidad; no romper base móvil) |

### 5.2.2 Nuevos (TypeScript)

| Componente | Responsabilidad | Justificación |
|---|---|---|
| `layout/AppLayout.tsx` | Shell responsive: sidebar (≥1024) + topbar/bottom-nav + campana con contador y Realtime | Un solo layout decide la navegación por viewport; el resto de páginas no sabe de responsive |
| `ui/States.tsx` | `LoadingState`, `EmptyState`, `ErrorState` | Estados de carga/vacío/error homogéneos en toda la app (accesibles: `role=status`, `aria-live`) |
| `ui/PhotoPickerModal.tsx` | Action-sheet Figma (Frame 22): cámara (`capture="environment"`) / galería / cancelar | En móvil el navegador abre la cámara nativa con un solo input; el modal imita el diseño |
| `ui/ChipGroup.tsx` | Grupo de chips seleccionables genérico | Reutilizado en Especie/Sexo/Tamaño (formularios) y filtros de Comunidad |
| `PetSelectCard.tsx` | Card_mascotas seleccionable (foto, nombre, especie·raza) | Pantalla "¿Cuál de tus mascotas se perdió?" con selección visual |
| `report/LocationField.tsx` | Campo de lugar: texto + "usar mi ubicación" + mini-mapa Leaflet + geocodificación inversa | Se repite en 3 formularios; aísla la lógica de mapa/geocoding |
| `report/PhotoGridField.tsx` | Grilla de hasta N fotos con vista previa y borrado | Se repite en 2 formularios; gestiona objectURLs y limpieza |

### 5.2.3 Capa de datos y estado

| Módulo | Responsabilidad | Justificación |
|---|---|---|
| `lib/supabase.ts` | Cliente único desde `.env` (publishable) | Un solo punto de configuración; sin secretos en código |
| `lib/api.ts` | **Única capa de acceso a datos** (~28 funciones: RPCs y consultas) | Páginas no escriben SQL/PostgREST: cambiar el backend no toca UI; facilita pruebas |
| `lib/types.ts` | Tipos de dominio (Profile, Pet, ReportNear, FeedItem, NotificationRow…) | Contrato tipado compartido |
| `lib/geo.ts` | Consentimiento (localStorage) + `getUserPoint()` con fallback Bogotá | Degradación elegante si el usuario niega GPS |
| `lib/geocode.ts` | Nominatim inverso/directo con **throttle 1 req/s** | Cumple la política de uso de OSM; sin API key |
| `lib/format.ts` | `timeAgo`, `dayLabel` (HOY/AYER), `distanceLabel`, `ageFromBirthDate` | Formatos humanos consistentes con Figma ("Parque Usaquén · hoy") |
| `contexts/AuthContext.tsx` | Sesión + perfil + `signIn/signUp/signOut`, errores traducidos al español | Única fuente de sesión; los errores de Supabase se humanizan |
| `hooks/useUserLocation.ts` | Punto + radio + consentimiento; persiste en `private_profiles` y `set_my_location` | **Trazabilidad Ley 1581** y radio configurable compartido por Home/Mapa/Formularios |

## 5.3 Sistema de diseño (tokens)

Fuente: Figma → `src/index.css` (`:root`)

| Token | Valor | Uso y justificación |
|---|---|---|
| `--pc-bg` | `#ede7fa` | Fondo lavanda del diseño móvil (continuidad de marca) |
| `--pc-surface` / `-strong` | `#fafafc` / `#ffffff` | Cards y botones flotantes |
| `--pc-primary` | `#ae77ff` | Acento principal Figma (botones, nav activo) |
| `--pc-primary-strong` | `#7519ff` | Títulos/enlaces (texto `#7519FF` del Figma) |
| `--pc-input` | `#e3dcf6` | Campos de formulario (los inputs del Figma) |
| `--pc-muted` / `-soft` | `#66557e` / `#8f86a3` | Texto secundario |
| Badges | lost `#f6c6ba`, found `#c4d6f7`, vet `#f3d9a4`, shelter `#c9ecd9`, question `#e4c8f4`, adopt `#f9d0e0` | Estados del componente `ETIQUETA` y filtros |
| Radios | 20 / 14 / 10 px | Cards grandes, tarjetas, controles |
| Tipografías | **Kodchasan** (títulos 600/700) + **Nata Sans** (cuerpo 400–700) | Ambas son las fuentes reales del Figma y existen en Google Fonts (carga por `<link>` con `display=swap`) |

**Justificación de tokens:** centralizar el Figma en variables CSS permite fidelidad exacta,
temas futuros y coherencia entre componentes sin repetir literales hex.

## 5.4 Estrategia responsive (mobile-first)

| Breakpoint | Comportamiento |
|---|---|
| **< 700 px** (móvil) | 1 columna, bottom-nav fija (62 px + `env(safe-area-inset-bottom)`), cards 2 columnas |
| **≥ 700 px** (tablet) | Cards a 3 columnas |
| **≥ 1024 px** (desktop) | **Sidebar** izquierda (250 px) con perfil+logout, topbar con campana, cards a 4 columnas, feed a 2 columnas, bottom-nav oculta |
| **≥ 1440 px** | Contenido máx. 1240 px (layouts de lectura) |

Decisiones y su justificación:

1. **Fieles al móvil, no "encogidos":** el shell cambia de navegación real (bottom-nav en
   móvil → sidebar en desktop), no solo el tamaño. El contenido usa grids fluidos
   (`repeat(auto)`/`minmax(0,1fr)`), nunca anchos fijos.
2. **Safe-areas y viewport dinámico:** `viewport-fit=cover` + `env(safe-area-inset-*)` +
   `100dvh` → en iPhone/Android con indicador de inicio la barra no se corta y el contenido
   no queda tapado (padding inferior `calc(110px + inset)`).
3. **Overflow cero:** `img { max-width: 100% }`, `overflow-x: hidden` en `body`,
   `min-width: 0` en hijos de flex/grid, **ellipsis** en textos de card (nombre/lugar).
   Verificado por script: `scrollWidth == clientWidth` en 320/360/412.
4. **Estados interactivos:** `:hover`, `:focus-visible` en botones/enlaces, `:active` con
   escala en el nav, `disabled` vía textos "Publicando…/Guardando…".
5. **Accesibilidad:** botones reales (no `div` clicables), `aria-label` en iconos,
   `aria-pressed` en chips/toggles, `role="status"`/`aria-live` en cargas, `<details>` nativo
   en FAQ, `label`→`input` con `htmlFor`/`id`.

## 5.5 Estados de UI por página (resumen)

Toda pantalla con datos implementa **loading / error / vacío** (ejemplos):
Home ("Todo tranquilo por aquí" si no hay reportes), Mapa ("Nada cerca por ahora"),
Comunidad ("Aún no hay publicaciones"), Notificaciones (estado vacío Figma con campana),
Ayuda (sin resultados → sugiere correo de soporte). *Justificación:* el prompt maestro de
la tesis exige que ninguna vista "desaparezca" durante una petición.

## 5.6 Rendimiento

- **Code-splitting natural por rutas** (Vite, imports dinámicos de React Router no requeridos aún por tamaño).
- Consultas **RPC únicas** por pantalla (`get_feed` trae autor+contadores; evita N+1).
- **Debounce** en el buscador de guías (350 ms) y throttle 1 req/s a Nominatim.
- **Realtime acotado** a 2 tablas + canal de layout (contador de campana).
- Imágenes desde Storage con `object-fit: cover` y bucket público (CDN de Supabase).
