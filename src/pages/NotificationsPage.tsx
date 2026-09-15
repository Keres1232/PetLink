import { useCallback, useEffect, useState } from "react";
import { Bell, CalendarDays, MapPin, MessageCircle } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { listNotifications, markNotificationRead } from "../lib/api";
import { timeAgo } from "../lib/format";
import { supabase } from "../lib/supabase";
import type { NotificationRow } from "../lib/types";
import "../styles/pages.css";

const TYPE_ICONS: Record<string, typeof Bell> = {
  geo_alert: MapPin,
  post_reply: MessageCircle,
  pet_reminder: CalendarDays,
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listNotifications());
    } catch {
      setError("No pudimos cargar tus notificaciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("my-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new as NotificationRow;
          setItems((prev) => (prev.some((n) => n.id === row.id) ? prev : [row, ...prev]));
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  async function handleOpen(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await markNotificationRead(id);
    } catch {
      /* la marca de leído no es crítica */
    }
  }

  return (
    <div>
      <div className="pc-page-header">
        <button
          type="button"
          className="pc-back-btn"
          onClick={() => window.history.back()}
          aria-label="Volver"
        >
          ‹
        </button>
        <h1 className="pc-title">Notificaciones</h1>
        <span style={{ width: 42 }} />
      </div>

      {loading && <LoadingState label="Cargando notificaciones…" />}
      {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={<Bell size={40} strokeWidth={1.6} />}
          title="Todo tranquilo por aquí"
          body="Te avisaremos cuando haya una alerta cerca, una respuesta a tu publicación o un recordatorio de tus mascotas."
        />
      )}

      <div className="notif-list">
        {items.map((n) => {
          const Icon = TYPE_ICONS[n.type] ?? Bell;
          return (
            <button
              key={n.id}
              type="button"
              className={`notif-row ${n.is_read ? "" : "notif-row--unread"}`}
              onClick={() => void handleOpen(n.id)}
            >
              <span className="notif-row__icon">
                <Icon size={18} />
              </span>
              <span>
                <span className="notif-row__title">{n.title}</span>
                {n.body && <span className="notif-row__body">{n.body}</span>}
                <span className="notif-row__time">{timeAgo(n.created_at)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
