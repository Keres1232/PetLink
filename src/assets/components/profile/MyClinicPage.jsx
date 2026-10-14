import { useCallback, useEffect, useRef, useState } from "react";
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
import { PRO_TEXT } from "../../../lib/professional";

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
function MyClinicPage({ role, kind = "clinic", onBack, onNotifications, onGoMap, onGiveForAdoption }) {
  // Textos según el tipo de cuenta: veterinaria, refugio o médico veterinario (consultorio)
  const t = PRO_TEXT[kind] ?? PRO_TEXT.clinic;
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
  // Dirección ⇄ mapa: cada uno completa al otro
  const [syncing, setSyncing] = useState(""); // "map" (buscando el punto) | "address" (buscando la dirección) | ""
  const [syncNote, setSyncNote] = useState("");
  const addressFromMap = useRef(null); // texto que puso el mapa: no se vuelve a buscar
  const typedAddress = useRef(false); // el usuario escribió la dirección (no viene de cargar el lugar)

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

  // Tocar el mapa (o "usar mi ubicación"): se marca el punto y se escribe su dirección
  const pick = async (p) => {
    setPoint(p);
    setSyncing("address");
    setSyncNote("");
    const text = await reverseGeocode(p).catch(() => null);
    setSyncing("");
    if (text) {
      addressFromMap.current = text;
      typedAddress.current = false;
      setAddress(text);
      setSyncNote("Escribimos la dirección del punto que marcaste. Puedes corregirla.");
    } else {
      setSyncNote("Marcamos el punto. No encontramos su dirección: escríbela tú.");
    }
  };

  // Escribir la dirección: al dejar de escribir (0,9 s) se ubica sola en el mapa
  const changeAddress = (value) => {
    typedAddress.current = true;
    setAddress(value);
  };
  useEffect(() => {
    const text = address.trim();
    if (!typedAddress.current || text.length < 6 || text === addressFromMap.current) return undefined;
    let alive = true;
    const timer = setTimeout(async () => {
      setSyncing("map");
      const p = await searchPlace(text).catch(() => null);
      if (!alive) return;
      setSyncing("");
      if (p) {
        setPoint(p);
        setSyncNote("Ubicamos la dirección en el mapa. Si no es exacto, toca el punto correcto.");
      } else {
        setSyncNote("No encontramos esa dirección en el mapa: escríbela más completa o toca el mapa.");
      }
    }, 900);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [address]);

  const locateMe = async () => {
    const p = await getUserPoint();
    if (p === DEFAULT_CENTER) {
      setError("No pudimos obtener tu ubicación. Marca el punto en el mapa.");
      return;
    }
    setError("");
    await pick(p);
  };

  const create = async () => {
    if (name.trim().length < 3) return setError(t.nameError);
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
        kind: kind === "shelter" || role === "foundation" ? "shelter" : "clinic",
      });
      setSaved(t.created);
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
      <AppHeader title={t.title} leftIcon={backIcon} onLeft={onBack} rightIcon={bellIcon} onRight={onNotifications} />

      <div className="report-lost my-clinic">
        {loading && <PawLoader />}

        {!loading && clinic && (
          <div className={`my-clinic__status ${clinic.verified ? "is-verified" : ""}`}>
            <strong>
              {clinic.verified ? t.verified : "Pendiente de verificación"}
            </strong>
            <span>{clinic.verified ? t.verifiedSub : t.pending}</span>
          </div>
        )}

        {!loading && !clinic && (
          <InfoNotice>{t.intro}</InfoNotice>
        )}

        {/* Refugio: atajo para publicar en adopción (llevan la etiqueta «Refugio») */}
        {!loading && t.adoptionCta && onGiveForAdoption && (
          <button type="button" className="my-clinic__adopt" onClick={onGiveForAdoption}>
            {t.adoptionCta} ›
          </button>
        )}

        {!loading && (
          <>
            <TextInputField label="Nombre" placeholder={t.namePlaceholder} value={name} onChange={setName} />
            <TextInputField label="Teléfono" optional type="tel" placeholder="Ej: 300 123 4567" value={phone} onChange={setPhone} />

            <div className="report-lost__place">
              <IconInputField
                label="Dirección"
                icon={<img src={locationIcon} alt="" className="my-clinic__icon" />}
                placeholder="Ej: Cll 1 #2-3, Usaquén, Bogotá"
                value={address}
                onChange={changeAddress}
              />
              {showPicker && (
                <div className="my-clinic__row">
                  <button type="button" className="report-lost__locate" onClick={() => void locateMe()}>
                    <TargetIcon />
                    Usar mi ubicación actual
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
                <span className="report-lost__label">Escribe la dirección o toca el mapa: uno completa al otro</span>
                <LocationPicker center={center} point={point} onPick={(p) => void pick(p)} />
                {(syncing || syncNote) && (
                  <p className="my-clinic__sync" role="status">
                    {syncing === "map"
                      ? "Buscando la dirección en el mapa…"
                      : syncing === "address"
                        ? "Buscando la dirección de ese punto…"
                        : syncNote}
                  </p>
                )}
              </>
            )}

            {error && <p className="auth-error" role="alert">{error}</p>}
            {saved && <p className="my-clinic__saved" role="status">{saved}</p>}

            {!clinic && (
              <button type="button" className="report-lost__submit" disabled={busy} onClick={() => void create()}>
                {busy ? "Guardando..." : t.create}
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
