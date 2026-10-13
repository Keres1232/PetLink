import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "./supabase";

/**
 * Notificaciones con la app CERRADA (Firebase Cloud Messaging).
 * El celular se registra, su token se guarda en public.push_tokens y la Edge Function
 * "send-push" lo usa cuando se crea una notificación.
 *
 * Solo se activa con VITE_PUSH_ENABLED=true: en Android, registrar sin google-services.json
 * cierra la app. Ver supabase/PUSH.md para configurarlo.
 */
const enabled = Capacitor.isNativePlatform() && import.meta.env.VITE_PUSH_ENABLED === "true";

let currentToken: string | null = null;
let listenersReady = false;

export async function registerPush(
  userId: string,
  onOpen?: (target: { notification_id?: string; type?: string; reference_id?: string }) => void
): Promise<void> {
  if (!enabled) return;

  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== "granted") return;

  if (!listenersReady) {
    listenersReady = true;
    await PushNotifications.createChannel({
      id: "alertas",
      name: "Alertas de PetClue",
      description: "Mascotas perdidas cerca, respuestas y avisos",
      importance: 5,
    });
    await PushNotifications.addListener("registration", async ({ value }) => {
      currentToken = value;
      const { error } = await supabase
        .from("push_tokens")
        .upsert({ token: value, user_id: userId, platform: "android", updated_at: new Date().toISOString() });
      if (error) console.error("[push] no se pudo guardar el token (¿corriste el SQL de push_tokens?)", error);
    });
    await PushNotifications.addListener("registrationError", (e) => console.error("[push] registro falló", e));
    // Tocar la notificación abre la publicación de donde salió (send-push manda type y reference_id)
    await PushNotifications.addListener("pushNotificationActionPerformed", ({ notification }) =>
      onOpen?.(notification.data ?? {})
    );
  }

  await PushNotifications.register();
}

/** Al desactivar las notificaciones o cerrar sesión: este celular deja de recibirlas. */
export async function unregisterPush(): Promise<void> {
  if (!enabled || !currentToken) return;
  await supabase.from("push_tokens").delete().eq("token", currentToken);
  currentToken = null;
}
