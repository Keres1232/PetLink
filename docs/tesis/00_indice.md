# Documentación técnica PetClue — Índice

> Catálogo e inventario completo del proyecto **PetClue** (plataforma de mascotas: reportes
> geolocalizados, comunidad, adopción y directorio veterinario) para el documento de tesis.
> Cada elemento incluye su **justificación de diseño** (por qué existe y por qué se implementó así).

**Repositorio:** `https://github.com/Keres1232/PetLink` — rama de desarrollo web: `web-development`
**Backend:** Supabase (PostgreSQL 17 + PostGIS 3.3.7) — proyecto `yiwzzwainwpiptevudkc`
**Figma (fuente de verdad visual):** `1H16RzUO5IkUyIIjh1DZcF` (v2) → `JMF96mNe0fM2xBKCvpRHMp` (v3)

---

## Documentos

| # | Documento | Contenido |
|---|---|---|
| 01 | [Visión y arquitectura](01_vision_y_arquitectura.md) | Producto, actores, alcance, stack, arquitectura general |
| 02 | [Inventario de tablas](02_bd_inventario_tablas.md) | Las 25 tablas con propósito, columnas clave y justificación |
| 03 | [Seguridad y RLS](03_bd_seguridad_rls.md) | Modelo de seguridad, RLS tabla por tabla, grants, Ley 1581 |
| 04 | [Funciones, triggers e índices](04_bd_funciones_triggers_indices.md) | 33 funciones, 9 triggers, 3 jobs cron, 56 índices, CHECKs |
| 05 | [Inventario del frontend](05_frontend_inventario.md) | Rutas, páginas, componentes, tokens, estrategia responsive |
| 06 | [Interacciones y flujos](06_interacciones_y_flujos.md) | Flujos end-to-end (auth, alertas, comunidad, notificaciones…) |
| 07 | [Decisiones de diseño](07_decisiones_de_diseno.md) | ADRs: cada decisión técnica con su justificación |
| 08 | [Trazabilidad Figma](08_trazabilidad_figma.md) | Pantalla Figma → ruta → datos → reglas |
| 09 | [Capturas de la aplicación](09_capturas.md) | 20 capturas reales (móvil + desktop + panel de moderación/admin) |

## Documentos existentes relacionados

- [`database_documentation.md`](../database_documentation.md) — visión arquitectónica + ADRs originales + changelog de migraciones.
- [`DATA_DICTIONARY.md`](../DATA_DICTIONARY.md) — diccionario columna por columna, catálogo de políticas RLS, funciones e índices.
- [`FIGMA_SCREEN_REVIEW.md`](../FIGMA_SCREEN_REVIEW.md) — revisión pantalla por pantalla contra el modelo de datos (v1→v3).
- Migraciones SQL aplicadas: `DB/0001…0029*.sql` + espejos de cada migración.

## Cómo citar en la tesis

Cada documento está numerado para mapear directo a capítulos:

- **Capítulo de diseño de base de datos** → docs 02, 03, 04 (+ `DATA_DICTIONARY.md`).
- **Capítulo de desarrollo web / interfaz** → docs 05, 08, 09 (capturas como evidencia).
- **Capítulo de interacciones y validación funcional** → doc 06 (+ capturas del panel admin en doc 09 §9.4).
- **Capítulo de decisiones y justificación metodológica** → doc 07.
