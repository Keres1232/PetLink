# 01 — Visión general y arquitectura

## 1.1 Qué es PetClue

Plataforma para dueños de mascotas en Bogotá con cuatro capacidades centrales:

1. **Reportes geolocalizados** de mascotas perdidas/encontradas, con alertas a usuarios dentro de un radio configurable.
2. **Comunidad** tipo foro (preguntas, consejos, historias, encontradas) con likes y comentarios en tiempo real.
3. **Información confiable**: guías de síntomas validadas por veterinarios (trazables a fuentes).
4. **Directorio geolocalizado** de veterinarias y refugios + adopción y mensajería dueño↔clínica.

**Marca:** PetClue (dominio `petclue.co`). El repositorio histórico se llama `PetLink`;
el rebrand se aplicó en la web (títulos, textos, README de producto).

## 1.2 Actores (roles)

| Rol | Descripción | Estado |
|---|---|---|
| `owner` | Dueño de mascota (usuario base) | Implementado |
| `vet` | Veterinario verificado (gestiona su clínica y perfil profesional) | Implementado (`/verificacion` + `/mi-clinica`) |
| `foundation` | Fundación/refugio verificado | Implementado (`/verificacion` + `/mi-clinica`, tipo refugio) |
| `admin` | Moderación de contenido y verificaciones | Panel en web (`/admin`, 4 colas) |

> El propio Figma (texto `2117:1115`) declara pendientes los flujos admin/vet; esta tesis
> justifica que **la base de datos ya los soporta** (roles, verificaciones, mensajería,
> moderación) y el alcance web implementado cubre el flujo `owner` completo.

## 1.3 Alcance implementado (web responsive)

- Autenticación real (registro/login/sesión/rutas protegidas).
- Home (feed + alertas cercanas + adopción + encontrados/pérdidos).
- Mapa (Leaflet/OSM + filtros) y reportes (selector + perdida propia + encontrada callejera).
- Comunidad v2 (chips por tipo, likes, comentarios Realtime, deep links).
- Notificaciones (Realtime + navegación por tipo).
- Perfil (mascotas, radio de alertas, consentimiento de ubicación).
- Cuenta (cambio de correo/contraseña) y Ayuda (FAQ + guías validadas).
- **Panel de administración** (`/admin`, guardia por rol): moderación de publicaciones,
  solicitudes de veterinario/fundación, clínicas pendientes de verificación y denuncias de
  comentarios.
- **Flujo profesional** (`/verificacion` + `/mi-clinica`): solicitud de verificación con
  documento privado, y creación/edición de la propia clínica o refugio (oculta del mapa
  público hasta que un admin la verifica).

## 1.4 Stack tecnológico

| Capa | Tecnología | Justificación (resumen, detalle en doc 07) |
|---|---|---|
| Base de datos | PostgreSQL 17 + **PostGIS 3.3.7** | Consultas geoespaciales nativas (`ST_DWithin`, índices GIST) sin servicios externos |
| Backend/BaaS | **Supabase** (Auth, PostgREST, Realtime, Storage, pg_cron) | RLS como autorización en el servidor, tiempo real y almacenamiento integrados |
| Frontend | **React 19 + Vite 8** | Continuidad con la base móvil existente; HMR rápido |
| Lenguaje | **JavaScript + TypeScript progresivo** (`allowJs`) | No reescribir lo existente; tipar todo lo nuevo |
| Ruteo | `react-router-dom` | URLs reales (deep links) y botón atrás del navegador |
| Mapas | **Leaflet + OpenStreetMap** + Nominatim | Costo cero, sin API keys; geocodificación inversa/directa |
| UI | CSS propio con tokens + Figma como fuente de verdad | Fidelidad visual y control total del responsive |
| Realtime | Supabase Realtime (publicación `comments`, `notifications`, `messages`) | Comentarios y notificaciones en vivo sin infraestructura propia |

## 1.5 Arquitectura general

```
┌───────────────────────────  NAVEGADOR  ───────────────────────────┐
│  React 19 (Vite)                                                  │
│  ├─ src/pages/*        (14 rutas)                                 │
│  ├─ src/components/*   (UI reutilizable)                          │
│  ├─ src/contexts/AuthContext.tsx      (sesión Supabase)           │
│  ├─ src/hooks/useUserLocation.ts      (ubicación + preferencias)  │
│  └─ src/lib/api.ts     (única capa de acceso a datos)             │
└───────────────┬───────────────────────────────┬───────────────────┘
                │ supabase-js (publishable key) │ fetch OSM/Nominatim
                ▼                               ▼
┌────────────────────────  SUPABASE  ───────────────────────────────┐
│  Auth (JWT)   PostgREST    Realtime        Storage (3 buckets)    │
│                 │             │                    │              │
│                 ▼             ▼                    ▼              │
│  ┌──────────────────────── PostgreSQL 17 ──────────────────────┐  │
│  │ 25 tablas · RLS en todas · 45 FKs · 56 índices              │  │
│  │ 33 funciones (RPC security definer + triggers)              │  │
│  │ PostGIS (geografía) · pg_cron (3 jobs) · MV del feed        │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

**Principio rector:** el cliente **nunca** es autoridad de seguridad. Toda operación sensible
(crear alerta, moderar, verificar clínicas, aceptar adopciones) pasa por funciones
`SECURITY DEFINER` con validaciones en el servidor; el resto se protege con RLS.

## 1.6 Entornos y configuración

| Elemento | Valor |
|---|---|
| Proyecto Supabase | `yiwzzwainwpiptevudkc` (us-east-2) |
| URL pública | `https://yiwzzwainwpiptevudkc.supabase.co` |
| Clave cliente | `sb_publishable_…` (pública; solo en `.env`, fuera de git) |
| Buckets | `pet-photos` (público), `post-images` (público), `vet-documents` (privado) |
| Dev local | `npm run dev -- --port 5175` → http://localhost:5175 |
| Scripts | `build`, `lint`, `typecheck` (tsc --noEmit) |

## 1.7 Estado de migraciones

29 migraciones aplicadas (`0001`–`0029` + ajustes `0028b`), documentadas con changelog
en [`database_documentation.md`](../database_documentation.md) §8. Ejes por etapa:

1. `0001–0008`: modelo base, seguridad RLS inicial, revisión crítica.
2. `0009–0013`: integración Figma v1 (adopción, refugios, preguntas, notificaciones), tiempo real, RPCs de app.
3. `0014–0023`: engagement (likes, feed, moderación), clínicas/mensajería, roles vet/foundation.
4. `0024–0029`: pantallas v2/v3 (detalle de mascota, reportes de callejeros con fotos y fecha/hora, **alertas como publicaciones**, notificación de likes, deep links).
