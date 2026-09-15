const statusStyles = {
  Perdido: "status-lost",
  Encontrado: "status-found",
  Adopción: "status-adoption",
  Rescatado: "status-rescued",
};

function StatusTag({ status = "Sin estado" }) {
  const statusClass =
    statusStyles[status] || "status-default";

  return (
    <span className={`status-tag ${statusClass}`}>
      {status.toUpperCase()}
    </span>
  );
}

export default StatusTag;