function StatusTag({ status }) {
  return (
    <span className={`status-tag status-${status.toLowerCase()}`}>
      {status.toUpperCase()}
    </span>
  );
}

export default StatusTag;