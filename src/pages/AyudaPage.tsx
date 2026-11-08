import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PawPrint, Search, ShieldCheck } from "lucide-react";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { LoadingState } from "../components/ui/States";
import { useAuth } from "../contexts/AuthContext";
import { useGuide } from "../contexts/GuideContext";
import { searchGuides, sendSupportMessage } from "../lib/api";
import type { GuideRow } from "../lib/types";
import "../styles/pages.css";

const FAQ: { q: string; a: string }[] = [
  {
    q: "¿Cómo reporto a mi mascota como perdida?",
    a: "Entra a Reportar → Se perdió mi mascota, elige cuál de tus mascotas es, indica el lugar y las características. Publicaremos una alerta a los usuarios cerca de la ubicación.",
  },
  {
    q: "¿Qué hago si encontré una mascota?",
    a: "Usa Reportar → Encontré una mascota. Agrega una foto clara, la especie, el lugar donde la encontraste y una descripción para que su familia pueda reconocerla.",
  },
  {
    q: "¿Cómo inscribo a mi mascota?",
    a: "Ve a Perfil → Inscribir mascota. Con su foto, especie, sexo, tamaño y señas particulares podremos generar la alerta automática si algún día se pierde.",
  },
  {
    q: "¿Quién puede ver mi ubicación?",
    a: "Tu ubicación solo se usa para mostrarte alertas y lugares cercanos. Puedes revisar o actualizar el permiso desde Perfil → Preferencias.",
  },
  {
    q: "¿Cómo cambio mi correo o mi contraseña?",
    a: "Desde Perfil → Cuenta puedes cambiar tu correo (requiere confirmación por enlace) y tu contraseña. Por seguridad, al cambiarla se cierra sesión en tus otros dispositivos.",
  },
  {
    q: "¿Por qué mi publicación dice que está en revisión?",
    a: "Algunas publicaciones pasan por moderación para cuidar a la comunidad. Una vez aprobadas se publican automáticamente.",
  },
  {
    q: "¿Qué son las guías de salud validadas?",
    a: "Son recomendaciones revisadas por veterinarios. Búscalas aquí mismo en Ayuda por síntoma; cada guía indica su nivel de urgencia.",
  },
  {
    q: "¿Cómo contacto a una veterinaria o refugio?",
    a: "En Mapa usa los filtros Veterinarias o Refugios. Toca el botón de llamada de la tarjeta para comunicarte directamente.",
  },
  {
    q: "¿Cómo doy una mascota en adopción?",
    a: "Publica en Comunidad con el tipo Encontrada o en la sección En adopción del inicio, y responde a las personas interesadas por los comentarios.",
  },
  {
    q: "¿Cómo reporto contenido inapropiado?",
    a: "Escríbenos a soporte@petclue.co con el enlace de la publicación y lo revisaremos lo antes posible.",
  },
];

function matches(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

export default function AyudaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openGuide } = useGuide();
  const [query, setQuery] = useState("");
  const [guides, setGuides] = useState<GuideRow[]>([]);
  const [guidesLoading, setGuidesLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [emailedOk, setEmailedOk] = useState(false);

  async function submitSupport() {
    if (busy) return;
    setError(null);
    const cleanMessage = message.trim();
    if (cleanMessage.length < 10) {
      setError("Cuéntanos un poco más (mínimo 10 caracteres).");
      return;
    }
    if (!email.includes("@") || email.trim().length < 5) {
      setError("Escribe un correo válido para responderte.");
      return;
    }
    setBusy(true);
    try {
      const { emailed } = await sendSupportMessage({
        message: cleanMessage,
        email: email.trim(),
      });
      setSent(true);
      setEmailedOk(emailed);
      setMessage("");
    } catch {
      setError(
        "No pudimos enviar tu mensaje. Intenta de nuevo o escríbenos a soporte@petclue.co."
      );
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      const q = query.trim();
      if (q.length < 3) {
        setGuides([]);
        return;
      }
      setGuidesLoading(true);
      void searchGuides(q, 6)
        .then(setGuides)
        .catch(() => setGuides([]))
        .finally(() => setGuidesLoading(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  const visibleFaq = FAQ.filter(
    (item) => !query.trim() || matches(item.q, query) || matches(item.a, query)
  );

  return (
    <div>
      <div className="pc-page-header">
        <button type="button" className="pc-back-btn" onClick={() => navigate(-1)} aria-label="Volver">
          ‹
        </button>
        <h1 className="pc-title">Ayuda y soporte</h1>
        <span style={{ width: 42 }} />
      </div>

      <button type="button" className="guide-tour__help-card" onClick={openGuide}>
        <span className="guide-tour__help-card-icon">
          <PawPrint size={20} />
        </span>
        <span className="guide-tour__help-card-text">
          <strong>Guía de PetClue</strong>
          <span>Repasa en un minuto todo lo que puedes hacer en la web y la app</span>
        </span>
        <span className="guide-tour__help-card-arrow" aria-hidden="true">
          ›
        </span>
      </button>

      <div className="pc-input" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Search size={16} color="var(--pc-muted-soft)" />
        <input
          style={{
            border: "none",
            background: "transparent",
            outline: "none",
            flex: 1,
            fontFamily: "inherit",
            fontSize: 14,
          }}
          placeholder="Busca tu duda…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Busca tu duda"
        />
      </div>

      {guidesLoading && <LoadingState label="Buscando en guías validadas…" />}

      {guides.length > 0 && (
        <>
          <h2 className="pc-section-title" style={{ margin: "18px 0 10px" }}>
            Guías validadas
          </h2>
          <div className="faq-list">
            {guides.map((g) => (
              <div key={g.id} className="guide-row">
                <div className="guide-row__head">
                  <strong>{g.symptom}</strong>
                  {g.urgency_level && (
                    <span className="pc-badge pc-badge--vet">{g.urgency_level}</span>
                  )}
                </div>
                <p>{g.recommendation}</p>
                <small>
                  <ShieldCheck size={12} style={{ verticalAlign: "-2px" }} />{" "}
                  {g.validated_by ? `Validada por ${g.validated_by}` : "Guía validada"}
                  {g.species_name ? ` · ${g.species_name}` : ""}
                </small>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="pc-section-title" style={{ margin: "18px 0 0" }}>
        Preguntas frecuentes
      </h2>

      <div className="faq-list">
        {visibleFaq.length === 0 && (
          <p className="pc-muted">
            No encontramos una pregunta con ese texto. Escríbenos a soporte@petclue.co
          </p>
        )}
        {visibleFaq.map((item) => (
          <details key={item.q} className="faq-item">
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>

      <h2 className="pc-section-title" style={{ margin: "22px 0 0" }}>
        ¿No encontraste tu respuesta?
      </h2>
      <p className="pc-muted" style={{ margin: "4px 0 12px" }}>
        Cuéntanos qué pasó y lo revisamos.
      </p>

      <div className="pc-form-card">
        <div className="pc-field">
          <label className="pc-field-label" htmlFor="help-message">
            Describe el problema
          </label>
          <textarea
            id="help-message"
            className="pc-textarea"
            rows={4}
            placeholder="Ej: No puedo actualizar la foto de mi mascota…"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setSent(false);
              setError(null);
            }}
          />
        </div>

        <div className="pc-field">
          <label className="pc-field-label" htmlFor="help-email">
            Correo para responderte
          </label>
          <input
            id="help-email"
            className="pc-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSent(false);
              setError(null);
            }}
          />
        </div>

        {error && (
          <p className="pc-error-text" role="alert">
            {error}
          </p>
        )}

        {sent && (
          <p className="help-form__sent" role="status">
            ¡Gracias! Revisaremos tu reporte pronto.
            {!emailedOk && (
              <>
                {" "}
                También puedes escribirnos a{" "}
                <a href="mailto:soporte@petclue.co">soporte@petclue.co</a>.
              </>
            )}
          </p>
        )}

        <div className="pc-form-actions">
          <PrimaryButton onClick={() => void submitSupport()} type="button" disabled={busy}>
            {busy ? "Enviando…" : "Enviar reporte"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
