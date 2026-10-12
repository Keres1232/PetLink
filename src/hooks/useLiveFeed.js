import { useCallback, useEffect, useRef, useState } from "react";
import { avatarsOf, getFeed, togglePostLike } from "../lib/api";
import { supabase } from "../lib/supabase";

const POLL_MS = 20000; // respaldo por si Realtime no está activo en alguna tabla

/**
 * Publicaciones de la comunidad con contadores en vivo.
 * Se recarga cuando alguien comenta o da like (Supabase Realtime), cada 20 s y al volver a la app.
 * `version` sube con cada cambio, para que quien muestre comentarios también los recargue.
 */
export default function useLiveFeed({ type, limit = 30, extra } = {}) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      let rows = await getFeed({ type, limit });
      if (extra) rows = await extra(rows);
      // Foto de perfil de cada autor (profiles.avatar_url); si falta la columna, quedan sin foto
      const avatars = await avatarsOf([...new Set(rows.map((r) => r.user_id))]);
      setFeed(rows.map((r) => ({ ...r, avatar_url: avatars[r.user_id] ?? null })));
      setError("");
    } catch (e) {
      console.error(e);
      setError("No pudimos cargar la comunidad.");
    } finally {
      setLoading(false);
    }
  }, [type, limit, extra]);

  // Varias señales seguidas (like + comentario) se juntan en una sola recarga
  const refresh = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setVersion((v) => v + 1);
      void load();
    }, 300);
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`live-feed-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_likes" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, refresh)
      .subscribe();

    const poll = setInterval(refresh, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(timer.current);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  // Me gusta: se marca al instante y se corrige con la respuesta del servidor
  const toggleLike = useCallback(async (postId) => {
    const flip = (liked) => (p) =>
      p.id === postId ? { ...p, liked_by_me: liked, like_count: Math.max(0, p.like_count + (liked ? 1 : -1)) } : p;
    const current = feed.find((p) => p.id === postId);
    if (!current) return;
    setFeed((list) => list.map(flip(!current.liked_by_me)));
    try {
      const nowLiked = await togglePostLike(postId);
      if (nowLiked === current.liked_by_me) setFeed((list) => list.map(flip(nowLiked)));
    } catch (e) {
      console.error("No se pudo registrar el me gusta", e);
      setFeed((list) => list.map(flip(current.liked_by_me)));
    }
  }, [feed]);

  return { feed, loading, error, version, reload: load, refresh, toggleLike };
}
