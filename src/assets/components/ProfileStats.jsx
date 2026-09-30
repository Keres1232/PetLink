import "./ProfileStats.css";

function StatItem({ value, label }) {
  return (
    <div className="profile-stats__item">
      <p className="profile-stats__value">{value}</p>
      <p className="profile-stats__label">{label}</p>
    </div>
  );
}

function ProfileStats({
  pets = 0,
  posts = 0,
  activeReports = 0,
}) {
  return (
    <article className="profile-stats">
      <div className="profile-stats__inner">

        <StatItem value={pets} label="Mascotas" />

        <span className="profile-stats__divider" />

        <StatItem value={posts} label="Publicaciones" />

        <span className="profile-stats__divider" />

        <StatItem value={activeReports} label="Reportes activos" />

      </div>
    </article>
  );
}

export default ProfileStats;