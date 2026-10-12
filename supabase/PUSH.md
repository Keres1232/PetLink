# Notificaciones con la app cerrada (push)

El código ya está listo en la app (`src/lib/push.ts`) y en Supabase (`supabase/functions/send-push`).
Falta conectar Firebase, que es el servicio de Google que entrega las notificaciones en Android.

## 1. Base de datos
Ejecuta `supabase/sql/2026-10-12_completar_app.sql` en Supabase → **SQL Editor** (crea la tabla `push_tokens`).

## 2. Firebase
1. Entra a <https://console.firebase.google.com> → **Agregar proyecto** (puede llamarse PetClue; Analytics no es necesario).
2. En el proyecto: **Agregar app → Android**.
   - Nombre del paquete: `com.petlink.app` (debe coincidir exactamente).
3. Descarga **`google-services.json`** y cópialo en `android/app/google-services.json`.
4. **Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada**. Se descarga un JSON: guárdalo, **no lo subas a git**.

## 3. Supabase
1. Instala la CLI si no la tienes: `npm i -g supabase` y luego `supabase login`.
2. Desde la carpeta del proyecto:
   ```
   supabase link --project-ref yiwzzwainwpiptevudkc
   supabase secrets set FIREBASE_SERVICE_ACCOUNT="$(cat ruta/al/archivo-de-cuenta-de-servicio.json)"
   supabase functions deploy send-push
   ```
3. En el panel de Supabase: **Database → Webhooks → Create a new hook**
   - Tabla: `public.notifications` · Evento: **Insert**
   - Tipo: **Supabase Edge Functions** → función `send-push` · Método POST

## 4. App
1. En `.env` agrega: `VITE_PUSH_ENABLED=true`
   (sin `google-services.json` NO lo actives: Android cierra la app al registrarse).
2. `npm run android:sync` y en Android Studio **Run ▶** / generar APK.
3. Inicia sesión y deja activado **Perfil → Notificaciones**: la app pedirá permiso y guardará el token.

## Probar
Con la app **cerrada** en el celular A, desde otra cuenta comenta una publicación de A
(o publica una alerta cerca): debe llegar la notificación. Al tocarla se abre la bandeja.

Si no llega: revisa en Supabase **Edge Functions → send-push → Logs** y que la tabla
`push_tokens` tenga una fila con el usuario.
