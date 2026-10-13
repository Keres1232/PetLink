import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  ensureNotificationPermission,
  onNotificationTap,
  requestNotificationPermission,
  showNotification,
} from "../lib/notify";
import { registerPush, unregisterPush } from "../lib/push";
import { useAuth } from "./AuthContext";

const NotificationsContext = createContext({
  unread: 0,
  refreshUnread: () => {},
  enabled: true,
  setEnabled: () => {},
  inboxRequests: 0,
  pendingOpen: null,
  clearPendingOpen: () => {},
});

// Interruptor general (Perfil → Notificaciones). Se guarda en este dispositivo.
const ENABLED_KEY = "petclue:notifications-enabled";
const readEnabled = () => {
  try {
    return localStorage.getItem(ENABLED_KEY) !== "no";
  } catch {
    return true;
  }
};

/**
 * Número de notificaciones sin leer (para el globito de la campana) y aviso del celular
 * cuando llega una nueva. Las notificaciones las crean los triggers notify_* de Supabase.
 */
export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [enabled, setEnabledState] = useState(readEnabled);
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const setEnabled = useCallback(async (on) => {
    setEnabledState(on);
    try {
      localStorage.setItem(ENABLED_KEY, on ? "yes" : "no");
    } catch {
      /* sin almacenamiento: queda solo para esta sesión */
    }
    // Al activarlas se pide el permiso del celular para mostrarlas fuera de la app
    if (on) await requestNotificationPermission().catch(() => false);
  }, []);

  // Antes el permiso del celular solo se pedía al tocar el interruptor de Ajustes, y sin él Android
  // descarta las notificaciones en silencio. Ahora se pide al entrar (una vez; si lo niega no se insiste).
  useEffect(() => {
    if (user && enabled) void ensureNotificationPermission().catch(() => false);
  }, [user, enabled]);

  const refreshUnread = useCallback(async () => {
    if (!user) return setUnread(0);
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    if (!error) setUnread(count ?? 0);
  }, [user]);

  useEffect(() => {
    void refreshUnread();
    if (!user) return;

    const channel = supabase
      .channel(`unread-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        ({ new: n }) => {
          setUnread((c) => c + 1);
          // También como notificación del celular, salvo que el usuario las haya desactivado
          if (enabledRef.current)
            void showNotification(n.title, n.body, { notification_id: n.id, type: n.type, reference_id: n.reference_id });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => void refreshUnread()
      )
      .subscribe();

    // Respaldo por si Realtime no está activo: al volver a la app y cada 30 s
    const onVisible = () => document.visibilityState === "visible" && void refreshUnread();
    document.addEventListener("visibilitychange", onVisible);
    const poll = setInterval(() => void refreshUnread(), 30000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [user, refreshUnread]);

  // Notificaciones con la app cerrada (push): el celular se registra mientras estén activadas
  const [inboxRequests, setInboxRequests] = useState(0); // sube al tocar una notificación sin destino
  // Notificación tocada (push o del sistema) cuyo destino hay que abrir: App la lleva a su publicación
  const [pendingOpen, setPendingOpen] = useState(null);
  const handleTap = useCallback((target) => {
    if (target?.type) setPendingOpen({ ...target, at: Date.now() });
    else setInboxRequests((n) => n + 1); // sin datos: se abre la bandeja
  }, []);
  const clearPendingOpen = useCallback(() => setPendingOpen(null), []);
  useEffect(() => onNotificationTap(handleTap), [handleTap]);

  useEffect(() => {
    if (!user) return;
    if (enabled) {
      registerPush(user.id, handleTap).catch((e) => console.error("[push]", e));
    } else {
      void unregisterPush();
    }
  }, [user, enabled, handleTap]);

  // Desactivadas: no hay globito en la campana (las notificaciones se siguen guardando y se ven en la bandeja)
  const value = useMemo(
    () => ({ unread: enabled ? unread : 0, refreshUnread, enabled, setEnabled, inboxRequests, pendingOpen, clearPendingOpen }),
    [unread, refreshUnread, enabled, setEnabled, inboxRequests, pendingOpen, clearPendingOpen]
  );
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => useContext(NotificationsContext);
