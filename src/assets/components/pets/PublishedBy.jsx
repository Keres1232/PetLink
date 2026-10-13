import { useEffect, useState } from "react";
import { PUBLISHER_LABEL } from "../../../lib/publisher";
import { getPublisher } from "../../../lib/api";

/**
 * "Publicado por: nombre" en la ficha de una mascota: quien publicó la alerta o la
 * mascota (en adopción o registrada). Si es tuya dice "Tú".
 */
function PublishedBy({ pet, myUserId, onLoaded }) {
  // undefined = cargando · null = no se pudo saber
  const [publisher, setPublisher] = useState(undefined);

  useEffect(() => {
    let alive = true;
    // Las alertas ya traen su dueño (user_id de reports_near / report_by_id); si no, se busca por el reporte
    const query = pet.ownerId ? { userId: pet.ownerId } : { reportId: pet.id };
    getPublisher(query)
      .then((p) => {
        if (!alive) return;
        setPublisher(p);
        onLoaded?.(p); // la ficha lo usa para no mostrar "Contactar" en lo que es tuyo
      })
      .catch((e) => {
        console.error("No se pudo cargar quién publicó", e);
        if (!alive) return;
        setPublisher(null);
        onLoaded?.(null); // no se supo quién: la ficha deja contactar
      });
    return () => {
      alive = false;
    };
  }, [pet.id, pet.isReport, pet.ownerId]);

  const isMe = Boolean(myUserId) && (publisher?.id === myUserId || (!pet.isReport && pet.isMine));

  const name = publisher === undefined ? "…" : isMe ? "Tú" : publisher?.name ?? "Usuario de PetClue";

  return (
    <p className="pet-detail__published">
      Publicado por: <strong>{name}</strong>
      {PUBLISHER_LABEL[publisher?.kind] && (
        <span className={`pet-card__publisher pet-card__publisher--inline pet-card__publisher--${publisher.kind}`}>
          ✓ {PUBLISHER_LABEL[publisher.kind]}
        </span>
      )}
    </p>
  );
}

export default PublishedBy;
