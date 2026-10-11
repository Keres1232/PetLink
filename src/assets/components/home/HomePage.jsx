import CircleIconButton from "../shared/CircleIconButton.jsx";
import PillButton from "../shared/PillButton.jsx";
import QuickActions from "./QuickActions.jsx";
import PetCard from "../pets/PetCard.jsx";
import ForumPost from "../community/ForumPost.jsx";
import Carousel from "./Carousel.jsx";
import bellIcon from "../../svg/bell.svg";
import mapIcon from "../../svg/Ver_todo.svg";
import commentIcon from "../../svg/Report/coment.svg";
import heartIcon from "../../svg/Report/corazon.svg";
import useLiveFeed from "../../../hooks/useLiveFeed.js";
import { timeAgo } from "../../../lib/format";
import { POST_TYPE_LABEL } from "../../../lib/postTypes";

function SectionHeader({ title, icon, onSeeAll }) {
  return (
    <div className="home-section__header">
      <h2 className="home-section__title">{title}</h2>
      <PillButton icon={icon} label="Ver todo" onClick={onSeeAll} />
    </div>
  );
}

function PetCarousel({ pets, statusKey, onPetClick }) {
  return (
    <Carousel>
      {pets.map((pet) => (
        <PetCard
          key={pet.id}
          status={pet[statusKey]}
          name={pet.name}
          location={pet.location}
          photoUrl={pet.photoUrl}
          onClick={() => onPetClick?.(pet)}
        />
      ))}
    </Carousel>
  );
}

function HomePage({
  userName = "usuario",
  nearPets = [],
  adoptionPets = [],
  foundPets = [],
  onNotifications,
  onLost,
  onFound,
  onPetClick,
  onSeeAllNear,
  onSeeAllCommunity,
  onSeeAllAdoption,
  onSeeAllFound,
  onOpenPost,
}) {
  // Publicación más reciente, con me gusta y contadores en vivo
  const { feed, toggleLike } = useLiveFeed({ limit: 1 });
  const latest = feed[0];

  return (
    <>
      <header className="home-header">
        <div>
          <p className="home-greeting">Hola, {userName}</p>
          <h1 className="home-title">Tu comunidad</h1>
        </div>

        <CircleIconButton
          icon={bellIcon}
          iconAlt="Notificaciones"
          ariaLabel="Notificaciones"
          onClick={onNotifications}
        />
      </header>

      <QuickActions onLost={onLost} onFound={onFound} />

      <section className="home-section">
        <SectionHeader title="Cerca de ti" icon={mapIcon} onSeeAll={onSeeAllNear} />
        <PetCarousel pets={nearPets} statusKey="status" onPetClick={onPetClick} />
      </section>

      <section className="home-section">
        <SectionHeader title="De la comunidad" icon={commentIcon} onSeeAll={onSeeAllCommunity} />
        {latest ? (
          <ForumPost
            userName={latest.author_name}
            timeAgo={timeAgo(latest.created_at)}
            category={POST_TYPE_LABEL[latest.type] ?? latest.type}
            question={latest.content}
            likes={latest.like_count}
            liked={latest.liked_by_me}
            onLike={() => void toggleLike(latest.id)}
            replies={latest.comment_count}
            onClick={() => onOpenPost?.(latest.id)}
          />
        ) : (
          <p className="home-section__empty">Aún no hay publicaciones en la comunidad.</p>
        )}
      </section>

      <section className="home-section">
        <SectionHeader title="En adopción" icon={heartIcon} onSeeAll={onSeeAllAdoption} />
        <PetCarousel pets={adoptionPets} statusKey="species" onPetClick={onPetClick} />
      </section>

      <section className="home-section">
        <SectionHeader title="Encontrados" icon={heartIcon} onSeeAll={onSeeAllFound} />
        <PetCarousel pets={foundPets} statusKey="species" onPetClick={onPetClick} />
      </section>
    </>
  );
}

export default HomePage;