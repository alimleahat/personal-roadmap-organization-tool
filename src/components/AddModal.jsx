import { inp as inpFn } from "../constants";

export default function AddModal({ newItem, setNewItem, tracks, phases, onAdd, onClose, t }) {
  const s = inpFn(t);

  return (
    <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: t.overlay, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24,
        width: 440, maxWidth: "92vw", boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18 }}>New Item</div>
        <input placeholder="Title" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} style={s} />
        <textarea placeholder="Short note (optional)" value={newItem.note} onChange={e => setNewItem({ ...newItem, note: e.target.value })} rows={2} style={{ ...s, resize: "vertical" }} />
        <select value={newItem.track} onChange={e => setNewItem({ ...newItem, track: e.target.value })} style={{ ...s, cursor: "pointer" }}>
          <option value="">Select track...</option>
          {tracks.map(tr => <option key={tr.id} value={tr.id}>{tr.label}</option>)}
        </select>
        <select value={newItem.phase} onChange={e => setNewItem({ ...newItem, phase: e.target.value })} style={{ ...s, cursor: "pointer" }}>
          <option value="">Select phase...</option>
          {phases.map(p => <option key={p.id} value={p.id}>{p.label} — {p.sub}</option>)}
        </select>
        <input type="date" value={newItem.dueDate || ""} onChange={e => setNewItem({ ...newItem, dueDate: e.target.value || null })} style={{ ...s, cursor: "pointer" }} placeholder="Due date (optional)" />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onAdd} style={{ flex: 1, padding: 10, background: t.accent, border: "none", borderRadius: 7, color: t.accentText, cursor: "pointer", fontWeight: 700, fontSize: 12.5, fontFamily: "inherit" }}>Add</button>
          <button onClick={onClose} style={{ padding: "10px 18px", background: "transparent", border: `1px solid ${t.border}`, borderRadius: 7, color: t.muted, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
