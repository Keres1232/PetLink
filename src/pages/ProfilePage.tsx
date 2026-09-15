import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, PawPrint, Plus } from "lucide-react";
import PetCard from "../components/PetCard.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { EmptyState, LoadingState } from "../components/ui/States";
import { useAuth } from "../contexts/AuthContext";
import { getPrivateProfile, myPets, updateSettings } from "../lib/api";
import { requestGeoConsent } from "../lib/geo";
import { dayLabel } from "../lib/format";
import type { Pet, PrivateProfile } from "../lib/types";
import "../styles/pages.css";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [settings, setSettings] = useState<PrivateProfile | null>(null);
  const [radius, setRadius] = useState(5000);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [myPetsList, priv] = await Promise.all([myPets(), getPrivateProfile()]);
      setPets(myPetsList);
      setSettings(priv);
      setRadius(priv?.alert_radius_m ?? 5000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveSettings() {
    await updateSettings({ alertRadiusM: radius });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <div className="pc-page-header">
        <h1 className="pc-title">Perfil</h1>
      </div>

      <div className="profile-card">
        <span className="profile-card__avatar" aria-hidden="true">
          {(profile?.name ?? "U").charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="profile-card__name">{profile?.name ?? "…"}</p>
          <span className="pc-badge pc-badge--question">{profile?.role ?? "owner"}</span>
        </div>
      </div>

      <section className="home__section">
        <div className="home__section-header">
          <h2 className="pc-section-title">Mis mascotas</h2>
          <button type="button" className="pc-pill-btn" onClick={() => navigate("/mascotas/nueva")}>
            <Plus size={15} /> Inscribir mascota
          </button>
        </div>

        {loading && <LoadingState label="Cargando tus mascotas…" />}

        {!loading && pets.length === 0 && (
          <EmptyState
            icon={<PawPrint size={36} strokeWidth={1.6} />}
            title="Inscribe tus mascotas"
            body="Regístralas para recibir recordatorios y reportarlas más rápido si se pierden."
            action={
              <PrimaryButton onClick={() => navigate("/mascotas/nueva")} type="button">
                Inscribir mi primera mascota
              </PrimaryButton>
            }
          />
        )}

        <div className="pc-cards-grid">
          {pets.map((p) => (
            <PetCard
              key={p.id}
              status={
                p.status === "for_adoption"
                  ? "Adopción"
                  : p.status === "lost"
                    ? "Perdido"
                    : p.status === "adopted"
                      ? "Rescatado"
                      : "Encontrado"
              }
              name={p.name}
              location={`${p.species?.name ?? "Mascota"} · ${dayLabel(p.created_at).toLowerCase()}`}
              photoUrl={p.photo_url ?? undefined}
            />
          ))}
        </div>
      </section>

      <section className="home__section">
        <h2 className="pc-section-title" style={{ marginBottom: 12 }}>Preferencias</h2>
        <div className="pc-form-card profile-settings">
          <div className="profile-settings__row">
            <label className="pc-field-label" htmlFor="radius" style={{ margin: 0, flex: 1 }}>
              Radio de alertas (metros)
            </label>
            <input
              id="radius"
              className="pc-input"
              type="number"
              min={500}
              max={20000}
              step={500}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
            />
            <PrimaryButton onClick={() => void saveSettings()} type="button">
              Guardar
            </PrimaryButton>
          </div>
          {saved && <p className="pc-muted" style={{ margin: 0 }}>Preferencias guardadas.</p>}

          <div className="profile-settings__row">
            <span className="pc-field-label" style={{ margin: 0, flex: 1 }}>
              Ubicación para alertas cercanas
            </span>
            <button
              type="button"
              className="pc-outline-btn"
              onClick={() => void requestGeoConsent()}
            >
              {settings?.geolocation_consent ? "Actualizar ubicación" : "Dar permiso de ubicación"}
            </button>
          </div>

          <button
            type="button"
            className="pc-outline-btn"
            style={{ alignSelf: "flex-start" }}
            onClick={() => void signOut()}
          >
            <LogOut size={14} style={{ verticalAlign: "middle" }} /> Cerrar sesión
          </button>
        </div>
      </section>
    </div>
  );
}
