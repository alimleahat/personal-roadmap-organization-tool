// Small, always-visible truth about whether your edits actually reached the
// server. "Saved" means it is committed to GitHub; anything else means the
// change is safe locally but not yet pushed.
export default function SyncStatus({ state, t }) {
  const map = {
    saving: { label: "Saving…", color: t.muted },
    synced: { label: "Saved", color: "#22C55E" },
    pending: { label: "Offline — will sync", color: "#F59E0B" },
    error: { label: "Not saved", color: t.danger },
  };
  const s = map[state] ?? map.synced;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, color: s.color, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}
