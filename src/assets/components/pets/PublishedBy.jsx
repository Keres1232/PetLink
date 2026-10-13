import { useEffect, useState } from "react";
import { PUBLISHER_LABEL } from "../../../lib/publisher";
import { getPublisher } from "../../../lib/api";

/**
 * "Publicado por: nombre" en la ficha de una mascota: quien publicó la alerta o la
 * mascota (en adopción o registrada). Si es tuya dice "Tú".
 */
function PublishedBy({ pet, myUserId }) {
  // undefined = cargando · null = no se pudo saber
  const [publisher, setPublisher] = useState(undefined);

  useEffect(() => {
    let alive = true;
    const query = pet.isReport ? { reportId: pet.id } : { userId: pet.ownerId };
    getPublisher(query)
      .then((p) => alive && setPublisher(p))
      .catch((e) => {
        console.error("No se pudo cargar quién publicó", e);
        if (alive) setPublisher(null);
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
