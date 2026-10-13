import { useCallback, useEffect, useState } from "react";
import AppHeader from "../shared/AppHeader.jsx";
import InfoNotice from "../shared/InfoNotice.jsx";
import IconInputField from "../shared/IconInputField.jsx";
import TextInputField from "../shared/TextInputField.jsx";
import LocationPicker from "../map/LocationPicker.jsx";
import { createMyClinic, myClinic, updateMyClinic, updateMyVerifiedClinic } from "../../../lib/api";
import { getUserPoint } from "../../../lib/geo";
import { reverseGeocode, searchPlace } from "../../../lib/geocode";
import { DEFAULT_CENTER } from "../../../lib/types";
import backIcon from "../../svg/Back.svg";
import bellIcon from "../../svg/bell.svg";
import locationIcon from "../../svg/Location icon.svg";
import "../reports/ReportLostPage.css";
import "./MyClinicPage.css";
import PawLoader from "../shared/PawLoader.jsx";

const KIND_LABEL = { clinic: "Veterinaria", shelter: "Refugio" };

const TargetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="3" fill="#7519FF" />
    <circle cx="12" cy="12" r="8" stroke="#7519FF" strokeWidth="2" fill="none" />
    <path d="M12 1V4M12 20V23M1 12H4M20 12H23" stroke="#7519FF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * "Mi clínica" (como en web-development): el lugar en el mapa de una cuenta verificada.
 * - Si el admin ya lo creó al aprobar, se muestra (verificado: solo lectura; la BD no deja editarlo).
 * - Si no tiene, el profesional lo crea marcando el punto en el mapa (create_clinic): queda pendiente
 *   y un admin decide si es Refugio o Veterinaria al verificarlo.
 */
function MyClinicPage({ role, onBack, onNotifications, onGoMap }) {
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [point, setPoint] = useState(null);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [moving, setMoving] = useState(false);

  const load = useCallback(async () => {
    try {
      const mine = await myClinic();
      setClinic(mine);
      if (mine) {
        setName(mine.name);
        setPhone(mine.phone ?? "");
        setAddress(mine.address ?? "");
      }
    } catch (e) {
      console.error(e);
      setError("No pudimos cargar tu lugar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void getUserPoint().then(setCenter);
  }, [load]);

  // Al marcar en el mapa se propone la dirección (si no la escribió)
  const pick = async (p) => {
    setPoint(p);
    if (!address.trim()) {
      const text = await reverseGeocode(p);
      if (text) setAddress(text);
    }
  };

  const locateMe = async () => {
    const p = await getUserPoint();
    if (p === DEFAULT_CENTER) {
      setError("No pudimos obtener tu ubicación. Marca el punto en el mapa.");
      return;
    }
    setError("");
    await pick(p);
  };

  const findAddress = async () => {
    setError("");
    const p = await searchPlace(address);
    if (p) setPoint(p);
    else setError("No encontramos esa dirección. Escríbela más completa o marca el punto en el mapa.");
  };

  const create = async () => {
    if (name.trim().length < 3) return setError("Escribe el nombre de tu veterinaria o refugio.");
    if (!point) return setError("Marca en el mapa dónde está (o usa tu ubicación actual).");
    setBusy(true);
    setError("");
    try {
      await createMyClinic({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim() || null,
        point,
        // Provisional según el rol; el admin decide la etiqueta definitiva al verificar
        kind: role === "foundation" ? "shelter" : "clinic",
      });
      setSaved("¡Listo! Tu lugar quedó pendiente de verificación.");
      await load();
    } catch (e) {
      console.error("create_clinic falló:", e);
      setError("No pudimos crear tu lugar. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const savePending = async () => {
    setBusy(true);
    setError("");
    try {
      await updateMyClinic(clinic.id, { name: name.trim(), address: address.trim(), phone: phone.trim() || null });
      setSaved("Cambios guardados.");
      await load();
    } catch (e) {
      console.error(e);
      setError("No pudimos guardar los cambios.");
    } finally {
      setBusy(false);
    }
  };

  // Lugar ya verificado: se edita con la RPC update_my_clinic
  const saveVerified = async () => {
    setBusy(true);
    setError("");
    setSaved("");
    try {
      const changedReviewable = name.trim() !== clinic.name || address.trim() !== (clinic.address ?? "");
      const backToReview = await updateMyVerifiedClinic({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim() || null,
        point: moving ? point : null,
        changedReviewable,
      });
      setSaved(
        backToReview
          ? "Cambios guardados. Como cambiaste el nombre, la dirección o la ubicación, un administrador lo revisará de nuevo."
          : "Teléfono actualizado."
      );
      setMoving(false);
      await load();
    } catch (e) {
      console.error(e);
      setError(e?.message || "No pudimos guardar los cambios.");
    } finally {
      setBusy(false);
    }
  };

  // Se muestra el mapa para marcar al crear el lugar, o si el dueño quiere moverlo
  const showPicker = !clinic || moving;

  return (
    <>
      <AppHeader title="Mi clínica" leftIcon={backIcon} onLeft={onBack} rightIcon={bellIcon} onRight={onNotifications} />

      <div className="report-lost my-clinic">
        {loading && <PawLoader />}

        {!loading && clinic && (
          <div className={`my-clinic__status ${clinic.verified ? "is-verified" : ""}`}>
            <strong>
              {clinic.verified ? `${KIND_LABEL[clinic.kind] ?? "Lugar"} verificado y visible en el mapa` : "Pendiente de verificación"}
            </strong>
            <span>
              {clinic.verified
                ? "Los usuarios ya pueden encontrarte en el mapa."
                : "Un administrador revisará tu lugar y decidirá si es un refugio o una veterinaria."}
            </span>
          </div>
        )}

        {!loading && !clinic && (
          <InfoNotice>
            Marca en el mapa dónde está tu veterinaria o refugio. Aparecerá en el mapa público cuando un administrador lo
            verifique.
          </InfoNotice>
        )}

        {!loading && (
          <>
            <TextInputField label="Nombre" placeholder="Ej: Veterinaria San Francisco" value={name} onChange={setName} />
            <TextInputField label="Teléfono" optional type="tel" placeholder="Ej: 300 123 4567" value={phone} onChange={setPhone} />

            <div className="report-lost__place">
              <IconInputField
                label="Dirección"
                icon={<img src={locationIcon} alt="" className="my-clinic__icon" />}
                placeholder="Ej: Cll 1 #2-3, Usaquén, Bogotá"
                value={address}
                onChange={setAddress}
              />
              {showPicker && (
                <div className="my-clinic__row">
                  <button type="button" className="report-lost__locate" onClick={() => void locateMe()}>
                    <TargetIcon />
                    Usar mi ubicación actual
                  </button>
                  <button type="button" className="report-lost__locate" onClick={() => void findAddress()} disabled={!address.trim()}>
                    Buscar dirección
                  </button>
                </div>
              )}
            </div>

            {clinic?.verified && !moving && (
              <button type="button" className="report-lost__locate" onClick={() => setMoving(true)}>
                <TargetIcon />
                Cambiar la ubicación en el mapa
              </button>
            )}

            {showPicker && (
              <>
                <span className="report-lost__label">Toca el mapa para marcar el lugar</span>
                <LocationPicker center={center} point={point} onPick={(p) => void pick(p)} />
              </>
            )}

            {error && <p className="auth-error" role="alert">{error}</p>}
            {saved && <p className="my-clinic__saved" role="status">{saved}</p>}

            {!clinic && (
              <button type="button" className="report-lost__submit" disabled={busy} onClick={() => void create()}>
                {busy ? "Guardando..." : "Crear mi lugar en el mapa"}
              </button>
            )}
            {clinic && !clinic.verified && (
              <button type="button" className="report-lost__submit" disabled={busy} onClick={() => void savePending()}>
                {busy ? "Guardando..." : "Guardar cambios"}
              </button>
            )}
            {clinic?.verified && (
              <>
                <p className="my-clinic__muted">
                  El teléfono se actualiza al instante. Si cambias el nombre, la dirección o la ubicación, un
                  administrador lo revisará de nuevo antes de mostrarlo.
                </p>
                <button
                  type="button"
                  className="report-lost__submit"
                  disabled={busy || name.trim().length < 3 || (moving && !point)}
                  onClick={() => void saveVerified()}
                >
                  {busy ? "Guardando..." : "Guardar cambios"}
                </button>
                <button type="button" className="report-lost__cancel" onClick={onGoMap}>
                  Ver en el mapa
                </button>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default MyClinicPage;
