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

/** Pide el permiso. Devuelve true si el usuario lo concedió. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (native) return (await LocalNotifications.requestPermissions()).display === "granted";
  if (!("Notification" in window)) return false;
  return (await Notification.requestPermission()) === "granted";
}

let nextId = 1;

/** Muestra una notificación del sistema si hay permiso; si no, no hace nada. */
export async function showNotification(title: string, body?: string | null): Promise<void> {
  if (!(await notificationsAllowed())) return;
  if (native) {
    await LocalNotifications.schedule({
      notifications: [{ id: nextId++, title, body: body ?? "" }],
    });
  } else {
    new Notification(title, { body: body ?? undefined });
  }
}
