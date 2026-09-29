import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, Clock, FileUp, ShieldCheck } from "lucide-react";
import PrimaryButton from "../components/PrimaryButton.jsx";
import ChipGroup from "../components/ui/ChipGroup";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useAuth } from "../contexts/AuthContext";
import { myVetApplication, submitVetApplication, uploadVetDocument } from "../lib/api";
import { timeAgo } from "../lib/format";
import type { VetApplication } from "../lib/types";
import "../styles/pages.css";

type ProRole = "vet" | "foundation";

const ROLE_OPTIONS: { value: ProRole; label: string }[] = [
  { value: "vet", label: "Veterinario/a" },
  { value: "foundation", label: "Refugio o fundación" },
];

function translateApplyError(message: string): string {
  if (message.includes("pending application")) return "Ya tienes una solicitud en revisión.";
  if (message.includes("professional role")) return "Tu cuenta ya tiene un rol profesional.";
  return "No pudimos enviar tu solicitud. Intenta de nuevo.";
}

export default function VetApplicationPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [app, setApp] = useState<VetApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<ProRole>("vet");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setApp(await myVetApplication());
    } catch {
      setError("No pudimos consultar tu solicitud.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isProfessional = profile?.role === "vet" || profile?.role === "foundation";

  async function submit() {
    if (!file) {
      setError("Adjunta tu documento de soporte (PDF o imagen).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("El documento no puede superar los 10 MB.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const path = await uploadVetDocument(file);
      await submitVetApplication(role, path);
      setSent(true);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(translateApplyError(message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="pc-page-header">
        <button type="button" className="pc-back-btn" onClick={() => navigate(-1)} aria-label="Volver">
          ‹
        </button>
        <h1 className="pc-title">Solicitar verificación</h1>
        <span style={{ width: 42 }} />
      </div>

      {loading && <LoadingState label="Consultando tu solicitud…" />}
      {!loading && error && !app && <ErrorState message={error} onRetry={() => void load()} />}

      {!loading && isProfessional && (
        <EmptyState
          icon={<BadgeCheck size={40} strokeWidth={1.6} />}
          title="Ya eres parte del equipo profesional"
          body="Tu cuenta está verificada. Crea o administra la página de tu clínica o refugio."
          action={
            <PrimaryButton onClick={() => navigate("/mi-clinica")} type="button">
              Ir a Mi clínica
            </PrimaryButton>
          }
        />
      )}

      {!loading && !isProfessional && app?.status === "pending" && (
        <div className="pc-form-card">
          <div className="pro-status">
            <span className="pro-status__icon">
              <Clock size={20} />
            </span>
            <div>
              <p className="pro-status__title">Solicitud en revisión</p>
              <p className="pc-muted pro-status__meta">
                {app.target_role === "foundation" ? "Refugio o fundación" : "Veterinario/a"} ·{" "}
                enviada {timeAgo(app.created_at)}
              </p>
            </div>
          </div>
          <p className="pc-muted pro-hint">
            El equipo de PetClue revisará tu documento. Te avisaremos cuando esté aprobada; si es
            rechazada podrás volver a intentarlo.
          </p>
        </div>
      )}

      {!loading && !isProfessional && app?.status !== "pending" && (
        <div className="pc-form-card">
          {sent && (
            <p className="auth-page__notice" role="status">
              ¡Solicitud enviada! La revisaremos y te avisaremos.
            </p>
          )}
          {app?.status === "rejected" && !sent && (
            <p className="pc-muted pro-hint" style={{ marginTop: 0 }}>
              Tu solicitud anterior fue rechazada el{" "}
              {new Date(app.created_at).toLocaleDateString("es-CO")}. Puedes intentarlo de nuevo
              con un documento válido.
            </p>
          )}

          <div className="pc-field">
            <span className="pc-field-label">¿Qué quieres verificar?</span>
            <ChipGroup options={ROLE_OPTIONS} value={role} onChange={setRole} label="Tipo de perfil" />
          </div>

          <div className="pc-field">
            <label className="pc-field-label" htmlFor="vet-doc">
              Documento de soporte
            </label>
            <input
              id="vet-doc"
              className="pc-input"
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="pc-muted pro-hint">
              Tarjeta profesional (veterinarios) o registro de la fundación, en PDF o imagen.
              Queda en un archivo privado: solo lo verá el equipo de moderación.
            </p>
          </div>

          {error && (
            <p className="pc-error-text" role="alert">
              {error}
            </p>
          )}

          <div className="pc-form-actions">
            <PrimaryButton onClick={() => void submit()} type="button">
              <FileUp size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
              {busy ? "Enviando…" : "Enviar solicitud"}
            </PrimaryButton>
          </div>

          <p className="pc-muted pro-hint">
            <ShieldCheck size={13} style={{ verticalAlign: "-2px" }} /> Al aprobarse, tu perfil
            pasa a veterinario o fundación y podrás publicar tu clínica o refugio.
          </p>
        </div>
      )}
    </div>
  );
}
