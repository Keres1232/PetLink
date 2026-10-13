import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

/**
 * Notificaciones del sistema: en la app Android usa el plugin de Capacitor
 * (permiso POST_NOTIFICATIONS); en el navegador, la Notification API.
 */
const native = Capacitor.isNativePlatform();

export async function notificationsAllowed(): Promise<boolean> {
  if (native) return (await LocalNotifications.checkPermissions()).display === "granted";
  return "Notification" in window && Notification.permission === "granted";
}

/**
 * Al abrir la app con sesión: si el permiso nunca se ha pedido, se pide (Android 13+ no muestra
 * nada sin POST_NOTIFICATIONS). Si el usuario ya lo negó, no se insiste (se activa desde Ajustes).
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (native) {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === "granted") return true;
    if (display === "denied") return false;
    return (await LocalNotifications.requestPermissions()).display === "granted";
  }
  if (!("Notification" in window)) return false;
  if (Notification.permission !== "default") return Notification.permission === "granted";
  return (await Notification.requestPermission()) === "granted";
}

// Canal de Android con importancia alta: la notificación aparece arriba (ventanita) con sonido y
// vibración. Es el mismo id que usan las push ("alertas", ver push.ts).
const CHANNEL_ID = "alertas";
let channelReady: Promise<void> | null = null;
function ensureChannel(): Promise<void> {
  if (!native) return Promise.resolve();
  channelReady ??= LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: "Alertas de PetClue",
    description: "Mascotas perdidas y encontradas cerca, respuestas y avisos",
    importance: 5,
    visibility: 1,
    vibration: true,
  }).catch((e) => console.warn("[notificaciones] no se pudo crear el canal", e));
  return channelReady;
}

/** Pide el permiso. Devuelve true si el usuario lo concedió. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (native) return (await LocalNotifications.requestPermissions()).display === "granted";
  if (!("Notification" in window)) return false;
  return (await Notification.requestPermission()) === "granted";
}

let nextId = 1;

/** Datos para abrir el destino al tocarla (la fila de notifications). */
export type NotificationTarget = { notification_id?: string; type?: string; reference_id?: string | null };

let onTap: ((target: NotificationTarget) => void) | null = null;
let tapListenerReady = false;

/** Qué hacer al tocar una notificación del sistema: abrir la publicación de donde salió. */
export function onNotificationTap(cb: (target: NotificationTarget) => void): () => void {
  onTap = cb;
  if (native && !tapListenerReady) {
    tapListenerReady = true;
    void LocalNotifications.addListener("localNotificationActionPerformed", ({ notification }) =>
      onTap?.((notification.extra ?? {}) as NotificationTarget)
    );
  }
  return () => {
    if (onTap === cb) onTap = null;
  };
}

/** Muestra una notificación del sistema si hay permiso; si no, no hace nada. */
export async function showNotification(title: string, body?: string | null, target?: NotificationTarget): Promise<void> {
  if (!(await notificationsAllowed())) return;
  if (native) {
    await ensureChannel();
    await LocalNotifications.schedule({
      notifications: [{ id: nextId++, title, body: body ?? "", extra: target ?? {}, channelId: CHANNEL_ID }],
    });
  } else {
    const n = new Notification(title, { body: body ?? undefined });
    n.onclick = () => {
      window.focus();
      if (target) onTap?.(target);
      n.close();
    };
  }
}
