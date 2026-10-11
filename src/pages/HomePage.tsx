import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Heart, Map as MapIcon, MessageCircle } from "lucide-react";
import AlertNotification from "../components/AlertNotification.jsx";
import PetCard from "../components/PetCard.jsx";
import ForumPost from "../components/ForumPost.jsx";
import QuickActions from "../components/QuickActions";
import PetDetailModal, { type PetDetailData } from "../components/ui/PetDetailModal";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useAuth } from "../contexts/AuthContext";
import { usePrefs } from "../hooks/usePrefs";
import { useUserLocation } from "../hooks/useUserLocation";
import { getFeed, reportsNear } from "../lib/api";
import { hasGeoDecision } from "../lib/geo";
import { ageFromBirthDate, dayLabel, distanceLabel, timeAgo } from "../lib/format";
import { supabase } from "../lib/supabase";
import type { FeedItem, GeoPoint, Pet, ReportNear } from "../lib/types";
import "../styles/pages.css";

export default function HomePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportNear[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [adoption, setAdoption] = useState<Pet[]>([]);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [showAllAdoption, setShowAllAdoption] = useState(false);
  const [showAllFound, setShowAllFound] = useState(false);
  const [detail, setDetail] = useState<PetDetailData | null>(null);
  const { prefs } = usePrefs();
  const { point, radius, consent, loading: locLoading, requestConsent } = useUserLocation();
  const askedRef = useRef(false);

  const load = useCallback(async (origin: GeoPoint, radiusM: number) => {
    setLoading(true);
    setError(null);
    try {
      const [near, posts, adoptionPets] = await Promise.all([
        reportsNear(origin, radiusM, 8),
        getFeed({ limit: 3 }),
        supabase
          .from("pets")
          .select("*, species:species(id, name)")
          .eq("status", "for_adoption")
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(8)
          .then(({ data }) => (data as unknown as Pet[]) ?? []),
      ]);
      setReports(near);
      setFeed(posts);
      setAdoption(adoptionPets);
    } catch {
      setError("No pudimos cargar tu inicio.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!locLoading) void load(point, radius);
  }, [locLoading, point, radius, load]);

  useEffect(() => {
    if (!locLoading && !consent && !hasGeoDecision() && !askedRef.current) {
      askedRef.current = true;
      void requestConsent();
    }
  }, [locLoading, consent, requestConsent]);

  const geoAlert = reports.find((r) => r.type === "lost");
  const found = reports.filter((r) => r.type === "found");
  const lost = reports.filter((r) => r.type === "lost");

  function reportDetail(r: ReportNear): PetDetailData {
    return {
      name: r.pet_name ?? r.species_name ?? "Mascota",
      photoUrl: r.pet_photo_url,
      location: `${r.description || "Cerca de ti"} · ${dayLabel(r.created_at).toLowerCase()}`,
      status: r.type === "lost" ? "Perdido" : "Encontrado",
      species: r.species_name,
      marks: r.description || null,
      postId: r.post_id,
    };
  }

  function petDetail(p: Pet): PetDetailData {
    return {
      name: p.name,
      photoUrl: p.photo_url,
      location: `${p.species?.name ?? "Mascota"} · ${dayLabel(p.created_at).toLowerCase()}`,
      status: p.species?.name ?? "Mascota",
      species: p.species?.name,
      breed: p.breed,
      age: ageFromBirthDate(p.birth_date),
      sex: p.sex,
      size: p.size,
      color: p.color,
      marks: p.description,
    };
  }

  return (
    <div className="home">
      <header className="home__header">
        <div>
          <p className="home__greeting">Hola, {profile?.name ?? "amigo"}</p>
          <h1 className="pc-title home__title">Tu comunidad</h1>
        </div>
        <button
          type="button"
          className="home__bell"
          onClick={() => navigate("/notificaciones")}
          aria-label="Notificaciones"
        >
          <Bell size={17} />
        </button>
      </header>

      <QuickActions
        onLost={() => navigate("/reportar/mi-mascota")}
        onFound={() => navigate("/reportar/encontrada")}
      />

      {loading && <LoadingState label="Cargando tu comunidad…" />}
      {!loading && error && <ErrorState message={error} onRetry={() => void load(point, radius)} />}

      {!loading && !error && (
        <>
          {prefs.petAlerts && geoAlert && !alertDismissed && (
            <AlertNotification
              description={
                `${
                  geoAlert.pet_name
                    ? `Se perdió ${geoAlert.pet_name}`
                    : "Se perdió una mascota"
                } a ${distanceLabel(geoAlert.distance_m)} de tu ubicación.` +
                (geoAlert.description ? ` Detalles: ${geoAlert.description}.` : "")
              }
              onViewDetail={() =>
                geoAlert.post_id
                  ? navigate(`/comunidad?post=${geoAlert.post_id}`)
                  : navigate("/mapa")
              }
              onNotMyArea={() => setAlertDismissed(true)}
            />
          )}

          <section className="home__section">
            <div className="home__section-header">
              <h2 className="pc-section-title">Cerca de ti</h2>
              <button
                type="button"
                className="pc-pill-btn"
                onClick={() => navigate("/mapa")}
              >
                <MapIcon size={15} /> Ver todo
              </button>
            </div>
            {reports.length === 0 ? (
              <EmptyState
                title="Todo tranquilo por aquí"
                body="Cuando haya reportes cerca de tu ubicación los verás en esta sección."
              />
            ) : (
              <div className="pc-cards-grid">
                {reports.slice(0, 4).map((r) => (
                  <PetCard
                    key={r.id}
                    status={r.type === "lost" ? "Perdido" : "Encontrado"}
                    name={r.pet_name ?? r.species_name ?? "Mascota"}
                    location={`${r.description || "Cerca de ti"} · ${dayLabel(r.created_at).toLowerCase()}`}
                    photoUrl={r.pet_photo_url ?? undefined}
                    onClick={() => setDetail(reportDetail(r))}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="home__section">
            <div className="home__section-header">
              <h2 className="pc-section-title">De la comunidad</h2>
              <button
                type="button"
                className="pc-pill-btn"
                onClick={() => navigate("/comunidad")}
              >
                <MessageCircle size={15} /> Ver todo
              </button>
            </div>
            {feed.length === 0 ? (
              <EmptyState
                title="Aún no hay publicaciones"
                body="Sé la primera persona en preguntar o compartir algo con la comunidad."
              />
            ) : (
              <div className="home__feed">
                {feed.map((item) => (
                  <ForumPost
                    key={item.id}
                    userName={item.author_name}
                    timeAgo={timeAgo(item.created_at)}
                    category={item.type === "question" ? "Pregunta" : "Post"}
                    question={item.content}
                    likes={item.like_count}
                    replies={item.comment_count}
                    liked={item.liked_by_me}
                    onClick={() => navigate("/comunidad")}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="home__section">
            <div className="home__section-header">
              <h2 className="pc-section-title">En adopción</h2>
              {adoption.length > 4 && (
                <button
                  type="button"
                  className="pc-pill-btn"
                  onClick={() => setShowAllAdoption((v) => !v)}
                >
                  <Heart size={15} /> {showAllAdoption ? "Ver menos" : "Ver todo"}
                </button>
              )}
            </div>
            {adoption.length === 0 ? (
              <EmptyState
                title="Nadie en adopción por ahora"
                body="Las mascotas que busquen hogar aparecerán aquí."
              />
            ) : (
              <div className="pc-cards-grid">
                {(showAllAdoption ? adoption : adoption.slice(0, 4)).map((p) => (
                  <PetCard
                    key={p.id}
                    status={p.species?.name ?? "Mascota"}
                    name={p.name}
                    location={`${p.breed || p.species?.name || "Mascota"} · ${dayLabel(p.created_at).toLowerCase()}`}
                    photoUrl={p.photo_url ?? undefined}
                    onClick={() => setDetail(petDetail(p))}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="home__section">
            <div className="home__section-header">
              <h2 className="pc-section-title">Encontrados</h2>
              {found.length > 4 && (
                <button
                  type="button"
                  className="pc-pill-btn"
                  onClick={() => setShowAllFound((v) => !v)}
                >
                  <Heart size={15} /> {showAllFound ? "Ver menos" : "Ver todo"}
                </button>
              )}
            </div>
            {found.length === 0 ? (
              <EmptyState
                title="Aún no hay mascotas encontradas"
                body="Cuando alguien reporte una mascota encontrada cerca, aparecerá aquí."
              />
            ) : (
              <div className="pc-cards-grid">
                {(showAllFound ? found : found.slice(0, 4)).map((r) => (
                  <PetCard
                    key={r.id}
                    status="Encontrado"
                    name={r.pet_name ?? r.species_name ?? "Mascota"}
                    location={`${r.description || "Cerca de ti"} · ${dayLabel(r.created_at).toLowerCase()}`}
                    photoUrl={r.pet_photo_url ?? undefined}
                    onClick={() => setDetail(reportDetail(r))}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="home__section">
            <div className="home__section-header">
              <h2 className="pc-section-title">Pérdidos</h2>
            </div>
            {lost.length === 0 ? (
              <EmptyState
                title="Sin mascotas perdidas cerca"
                body="Si alguien reporta una mascota perdida en tu zona, la verás aquí."
              />
            ) : (
              <div className="pc-cards-grid">
                {lost.slice(0, 4).map((r) => (
                  <PetCard
                    key={r.id}
                    status="Perdido"
                    name={r.pet_name ?? r.species_name ?? "Mascota"}
                    location={`${r.description || "Cerca de ti"} · ${dayLabel(r.created_at).toLowerCase()}`}
                    photoUrl={r.pet_photo_url ?? undefined}
                    onClick={() => setDetail(reportDetail(r))}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <PetDetailModal data={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
