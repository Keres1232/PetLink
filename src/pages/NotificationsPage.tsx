import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CalendarDays, Heart, MapPin, MessageCircle } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import {
  getCommentById,
  getPostByReportId,
  listNotifications,
  markNotificationRead,
} from "../lib/api";
import { timeAgo } from "../lib/format";
import { supabase } from "../lib/supabase";
import type { NotificationRow } from "../lib/types";
import "../styles/pages.css";

const TYPE_ICONS: Record<string, typeof Bell> = {
  geo_alert: MapPin,
  post_reply: MessageCircle,
  post_like: Heart,
  pet_reminder: CalendarDays,
};

export default function NotificationsPage() {
  const navigate = useNavigate();
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

  async function handleOpen(n: NotificationRow) {
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    try {
      await markNotificationRead(n.id);
    } catch {
      /* la marca de leído no es crítica */
    }

    try {
      if (n.type === "post_like" && n.reference_id) {
        navigate(`/comunidad?post=${n.reference_id}`);
        return;
      }
      if (n.type === "post_reply" && n.reference_id) {
        const comment = await getCommentById(n.reference_id);
        if (comment) navigate(`/comunidad?post=${comment.post_id}&comment=${comment.id}`);
        return;
      }
      if (n.type === "geo_alert" && n.reference_id) {
        const post = await getPostByReportId(n.reference_id);
        navigate(
          post ? `/comunidad?post=${post.id}` : `/mapa?report=${n.reference_id}`
        );
        return;
      }
      if (n.type === "pet_reminder") {
        navigate("/perfil");
      }
    } catch {
      /* si no se puede resolver el destino, la notificación queda como leída */
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
              onClick={() => void handleOpen(n)}
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
