import { useEffect, useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import InfoNotice from "../shared/InfoNotice.jsx";
import PawLoader from "../shared/PawLoader.jsx";
import { myClinics } from "../../../lib/api";
import { PRO_TEXT } from "../../../lib/professional";
import backIcon from "../../svg/Back.svg";
import bellIcon from "../../svg/bell.svg";
import locationIcon from "../../svg/Location icon.svg";
import "../reports/ReportLostPage.css";
import "./MyClinicPage.css";

/**
 * "Mis veterinarias / Mis refugios / Mis consultorios": todas las sedes de la cuenta, como
 * "Mis mascotas". Tocar una la abre para verla, editarla o eliminarla; "Agregar" crea otra.
 */
function MyPlacesPage({ kind = "clinic", onBack, onNotifications, onOpen, onAdd, onGoMap, onGiveForAdoption }) {
  const t = PRO_TEXT[kind] ?? PRO_TEXT.clinic;
  const [places, setPlaces] = useState(null); // null = cargando
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    myClinics()
      .then((rows) => alive && setPlaces(rows))
      .catch((e) => {
        console.error(e);
        if (!alive) return;
        setPlaces([]);
        setError("No pudimos cargar tus sedes.");
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <AppHeader title={t.listTitle} leftIcon={backIcon} onLeft={onBack} rightIcon={bellIcon} onRight={onNotifications} />

      <div className="report-lost my-clinic">
        <InfoNotice>{t.listIntro}</InfoNotice>

        {/* Refugio: atajo para publicar en adopción (llevan la etiqueta «Refugio») */}
        {t.adoptionCta && onGiveForAdoption && (
          <button type="button" className="my-clinic__adopt" onClick={onGiveForAdoption}>
            {t.adoptionCta} ›
          </button>
        )}

        {places === null && <PawLoader />}
        {error && <p className="auth-error" role="alert">{error}</p>}
        {places?.length === 0 && !error && <p className="my-clinic__muted my-places__empty">{t.empty}</p>}

        <div className="my-places__list">
          {places?.map((p) => (
            <article key={p.id} className="my-places__card" onClick={() => onOpen?.(p.id)}>
              <span className="my-places__pin">
                <img src={locationIcon} alt="" />
              </span>
              <span className="my-places__info">
                <span className="my-places__name">{p.name}</span>
                <span className="my-places__address">{p.address || "Sin dirección"}</span>
                <span className={`my-places__status ${p.verified ? "is-verified" : ""}`}>
                  {p.verified ? "✓ Verificada · visible en el mapa" : "Pendiente de verificación"}
                </span>
              </span>
              {p.verified && p.point && (
                <button
                  type="button"
                  className="vet-card__locate my-places__map"
                  onClick={(e) => {
                    e.stopPropagation(); // no abre la sede
                    onGoMap?.(p);
                  }}
                >
                  Ver en el mapa
                </button>
              )}
            </article>
          ))}
        </div>

        {places !== null && (
          <button type="button" className="report-lost__submit" onClick={onAdd}>
            + {places.length ? t.addLabel : t.addFirst}
          </button>
        )}
      </div>
    </>
  );
}

export default MyPlacesPage;
