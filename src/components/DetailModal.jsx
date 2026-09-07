import { useState, useEffect } from "react";
import { STATUSES, inp as inpFn } from "../constants";

export default function DetailModal({ item, tracks, phases, onClose, onDelete, onUpdateItem, t }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...item });
  const s = inpFn(t);

  useEffect(() => {
    setDraft({ ...item });
    setEditing(false);
  }, [item]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        if (editing) { setEditing(false); setDraft({ ...item }); }
        else onClose();
      }
      if (editing && (e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onUpdateItem(draft);
        setEditing(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editing, draft, item, onClose, onUpdateItem]);

  const track = tracks.find(tr => tr.id === (editing ? draft.track : item.track));
  const phase = phases.find(p => p.id === (editing ? draft.phase : item.phase));

  const setStatus = (status) => onUpdateItem({ ...item, status });

  const pill = (st, active) => ({
    padding: "4px 13px", borderRadius: 20,
    border: `1px solid ${active ? st.color : t.border}`,
    background: active ? st.color + "1A" : "transparent",
    color: active ? st.color : t.muted,
    cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit",
    transition: "all 0.12s",
  });

  const btn = (bg, color, border) => ({
    padding: "9px 18px", background: bg, border: border ? `1px solid ${border}` : "none",
    borderRadius: 7, color, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600,
  });

  return (
    <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: t.overlay, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: t.surface, border: `1px solid ${t.border}`, borderTop: `3px solid ${track?.color}`,
        borderRadius: 12, padding: 24, width: 440, maxWidth: "92vw",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
      }}>
        {!editing ? (
          <>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: track?.color, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>{track?.label}</div>
              <div style={{ fontSize: 11, color: t.muted }}>{phase?.label} · {phase?.sub}</div>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: t.text, marginBottom: 14, lineHeight: 1.3 }}>{item.title}</div>
            {item.note && (
              <div style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.7, padding: "12px 14px", background: t.bg, borderRadius: 7, border: `1px solid ${t.border}`, marginBottom: 14 }}>{item.note}</div>
            )}
            {item.dueDate && (
              <div style={{ fontSize: 11, color: t.muted, marginBottom: 14 }}>Due: {new Date(item.dueDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
            )}
            <div style={{ display: "flex", gap: 5, marginBottom: 18, flexWrap: "wrap" }}>
              {STATUSES.map(st => (
                <button key={st.id} onClick={() => setStatus(st.id)} style={pill(st, item.status === st.id)}>{st.label}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEditing(true)} style={btn(t.accent, t.accentText, null)}>Edit</button>
              <button onClick={onClose} style={btn("transparent", t.muted, t.border)}>Close</button>
              <div style={{ flex: 1 }} />
              <button onClick={onDelete} style={btn("transparent", t.danger, t.dangerBorder)}>Delete</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18 }}>Edit Item</div>
            <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} style={s} placeholder="Title" />
            <textarea value={draft.note || ""} onChange={e => setDraft({ ...draft, note: e.target.value })} rows={3} style={{ ...s, resize: "vertical" }} placeholder="Note" />
            <select value={draft.track} onChange={e => setDraft({ ...draft, track: e.target.value })} style={{ ...s, cursor: "pointer" }}>
              {tracks.map(tr => <option key={tr.id} value={tr.id}>{tr.label}</option>)}
            </select>
            <select value={draft.phase} onChange={e => setDraft({ ...draft, phase: e.target.value })} style={{ ...s, cursor: "pointer" }}>
              {phases.map(p => <option key={p.id} value={p.id}>{p.label} — {p.sub}</option>)}
            </select>
            <input type="date" value={draft.dueDate || ""} onChange={e => setDraft({ ...draft, dueDate: e.target.value || null })} style={{ ...s, cursor: "pointer" }} />
            <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
              {STATUSES.map(st => (
                <button key={st.id} onClick={() => setDraft({ ...draft, status: st.id })} style={pill(st, draft.status === st.id)}>{st.label}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { onUpdateItem(draft); setEditing(false); }} style={btn(t.accent, t.accentText, null)}>Save</button>
              <button onClick={() => { setEditing(false); setDraft({ ...item }); }} style={btn("transparent", t.muted, t.border)}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
