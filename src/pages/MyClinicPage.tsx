import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, Clock } from "lucide-react";
import LocationField from "../components/report/LocationField";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { EmptyState, LoadingState } from "../components/ui/States";
import { useAuth } from "../contexts/AuthContext";
import { createMyClinic, myClinic, updateMyClinic } from "../lib/api";
import type { GeoPoint, MyClinic } from "../lib/types";
import "../components/report/report.css";
import "../styles/pages.css";

export default function MyClinicPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [clinic, setClinic] = useState<MyClinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [locationText, setLocationText] = useState("");
  const [point, setPoint] = useState<GeoPoint | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const mine = await myClinic();
      setClinic(mine);
      if (mine) {
        setName(mine.name);
        setPhone(mine.phone ?? "");
        setLocationText(mine.address ?? "");
      }
    } catch {
      setError("No pudimos cargar tu clínica.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isProfessional = profile?.role === "vet" || profile?.role === "foundation";
  const kind: "clinic" | "shelter" = profile?.role === "foundation" ? "shelter" : "clinic";
  const kindLabel = kind === "shelter" ? "Refugio" : "Clínica veterinaria";

  async function create() {
    if (name.trim().length < 3) {
      setError("Escribe el nombre de tu clínica o refugio.");
      return;
    }
    if (!point) {
      setError("Marca tu ubicación en el mapa (o usa tu ubicación actual).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createMyClinic({
        name: name.trim(),
        address: locationText.trim(),
        phone: phone.trim() || null,
        point,
        kind,
      });
      setSaved(true);
      await load();
    } catch (err) {
      console.error("create_clinic falló:", err);
      setError("No pudimos crear tu página. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function savePending() {
    if (!clinic) return;
    setBusy(true);
    setError(null);
    try {
      await updateMyClinic(clinic.id, {
        name: name.trim(),
        address: locationText.trim(),
        phone: phone.trim() || null,
      });
      setSaved(true);
      await load();
    } catch (err) {
      console.error("update clinic falló:", err);
      setError("No pudimos guardar los cambios.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState label="Cargando tu clínica…" />;

  if (!isProfessional) {
    return (
      <div>
        <div className="pc-page-header">
          <button type="button" className="pc-back-btn" onClick={() => navigate(-1)} aria-label="Volver">
            ‹
          </button>
          <h1 className="pc-title">Mi clínica</h1>
          <span style={{ width: 42 }} />
        </div>
        <EmptyState
          icon={<BadgeCheck size={40} strokeWidth={1.6} />}
          title="Necesitas una cuenta profesional"
          body="Solicita la verificación como veterinario o fundación para publicar tu página."
          action={
            <PrimaryButton onClick={() => navigate("/verificacion")} type="button">
              Solicitar verificación
            </PrimaryButton>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="pc-page-header">
        <button type="button" className="pc-back-btn" onClick={() => navigate(-1)} aria-label="Volver">
          ‹
        </button>
        <h1 className="pc-title">{clinic ? "Mi clínica" : `Crear ${kindLabel.toLowerCase()}`}</h1>
        <span style={{ width: 42 }} />
      </div>

      <div className="pc-form-card">
        {clinic && (
          <div className="pro-status">
            <span className="pro-status__icon">
              {clinic.verified ? <BadgeCheck size={20} /> : <Clock size={20} />}
            </span>
            <div>
              <p className="pro-status__title">
                {clinic.verified ? "Verificada y visible en el mapa" : "Pendiente de verificación"}
              </p>
              <p className="pc-muted pro-status__meta">
                {kindLabel}
                {clinic.verified
                  ? " · los usuarios ya pueden encontrarte"
                  : " · un administrador revisará tu página"}
              </p>
            </div>
          </div>
        )}

        {saved && (
          <p className="auth-page__notice" role="status">
            Cambios guardados.
          </p>
        )}

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="clinic-name">
            Nombre
          </label>
          <input
            id="clinic-name"
            className="pc-input"
            placeholder={kind === "shelter" ? "Ej: Refugio Patitas" : "Ej: Veterinaria Laika"}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="clinic-phone">
            Teléfono (opcional)
          </label>
          <input
            id="clinic-phone"
            className="pc-input"
            placeholder="Ej: 601 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {clinic ? (
          <div className="pc-field">
            <label className="pc-field-label" htmlFor="clinic-address">
              Dirección
            </label>
            <input
              id="clinic-address"
              className="pc-input"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
            />
          </div>
        ) : (
          <LocationField
            label="Ubicación"
            placeholder="Ej: Cra 7 # 45-12, Bogotá"
            text={locationText}
            onTextChange={setLocationText}
            point={point}
            onPointChange={setPoint}
            help="Marca en el mapa dónde está tu clínica o refugio; aparecerá en el mapa público cuando un administrador la verifique."
          />
        )}

        {error && (
          <p className="pc-error-text" role="alert">
            {error}
          </p>
        )}

        <div className="pc-form-actions">
          {clinic ? (
            clinic.verified ? (
              <button type="button" className="pc-outline-btn" onClick={() => navigate("/mapa")}>
                Ver en el mapa
              </button>
            ) : (
              <PrimaryButton onClick={() => void savePending()} type="button">
                {busy ? "Guardando…" : "Guardar cambios"}
              </PrimaryButton>
            )
          ) : (
            <PrimaryButton onClick={() => void create()} type="button">
              {busy ? "Creando…" : "Crear página"}
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
