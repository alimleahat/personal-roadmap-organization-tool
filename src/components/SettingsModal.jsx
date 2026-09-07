import { useState } from "react";
import { TRACK_COLORS, inp as inpFn } from "../constants";
import { uid } from "../utils";

export default function SettingsModal({ tracks, setTracks, phases, setPhases, onClose, t }) {
  const [tab, setTab] = useState("tracks");
  const s = inpFn(t);

  const tabBtn = (id, label) => ({
    padding: "8px 16px", background: "none", border: "none",
    borderBottom: tab === id ? `2px solid ${t.text}` : "2px solid transparent",
    color: tab === id ? t.text : t.muted, cursor: "pointer",
    fontSize: 11.5, fontWeight: 600, fontFamily: "inherit",
  });

  const addTrack = () => {
    const color = TRACK_COLORS[tracks.length % TRACK_COLORS.length];
    setTracks([...tracks, { id: uid(), label: "New Track", color }]);
  };

  const updateTrack = (idx, field, value) => {
    const next = [...tracks];
    next[idx] = { ...next[idx], [field]: value };
    setTracks(next);
  };

  const removeTrack = (idx) => {
    setTracks(tracks.filter((_, i) => i !== idx));
  };

  const moveTrack = (idx, dir) => {
    const next = [...tracks];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setTracks(next);
  };

  const addPhase = () => {
    setPhases([...phases, { id: uid(), label: "New Phase", sub: "" }]);
  };

  const updatePhase = (idx, field, value) => {
    const next = [...phases];
    next[idx] = { ...next[idx], [field]: value };
    setPhases(next);
  };

  const removePhase = (idx) => {
    setPhases(phases.filter((_, i) => i !== idx));
  };

  const movePhase = (idx, dir) => {
    const next = [...phases];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setPhases(next);
  };

  const rowStyle = {
    display: "flex", gap: 6, alignItems: "center", marginBottom: 6,
    padding: "6px 8px", background: t.card, border: `1px solid ${t.border}`,
    borderRadius: 7,
  };

  const smallBtn = (color) => ({
    background: "none", border: "none", color: color || t.muted,
    cursor: "pointer", fontSize: 14, padding: "2px 4px", fontFamily: "inherit", lineHeight: 1,
  });

  return (
    <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: t.overlay, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24,
        width: 520, maxWidth: "92vw", maxHeight: "80vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Settings</div>

        <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${t.border}`, marginBottom: 14 }}>
          <button onClick={() => setTab("tracks")} style={tabBtn("tracks", "Tracks")}>Tracks</button>
          <button onClick={() => setTab("phases")} style={tabBtn("phases", "Phases")}>Phases</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", marginBottom: 14 }}>
          {tab === "tracks" && (
            <>
              {tracks.map((track, i) => (
                <div key={track.id} style={rowStyle}>
                  <input type="color" value={track.color} onChange={e => updateTrack(i, "color", e.target.value)}
                    style={{ width: 24, height: 24, border: "none", background: "none", cursor: "pointer", padding: 0 }} />
                  <input value={track.label} onChange={e => updateTrack(i, "label", e.target.value)}
                    style={{ ...s, marginBottom: 0, flex: 1, padding: "6px 8px", fontSize: 12 }} />
                  <button onClick={() => moveTrack(i, -1)} style={smallBtn()} title="Move up">↑</button>
                  <button onClick={() => moveTrack(i, 1)} style={smallBtn()} title="Move down">↓</button>
                  <button onClick={() => removeTrack(i)} style={smallBtn(t.danger)} title="Remove">×</button>
                </div>
              ))}
              <button onClick={addTrack} style={{
                width: "100%", padding: 8, background: "transparent", border: `1px dashed ${t.border}`,
                borderRadius: 7, color: t.muted, cursor: "pointer", fontSize: 12, fontFamily: "inherit", marginTop: 4,
              }}>+ Add Track</button>
            </>
          )}
          {tab === "phases" && (
            <>
              {phases.map((phase, i) => (
                <div key={phase.id} style={rowStyle}>
                  <div style={{ flex: 1, display: "flex", gap: 6 }}>
                    <input value={phase.label} onChange={e => updatePhase(i, "label", e.target.value)} placeholder="Label"
                      style={{ ...s, marginBottom: 0, flex: 1, padding: "6px 8px", fontSize: 12 }} />
                    <input value={phase.sub || ""} onChange={e => updatePhase(i, "sub", e.target.value)} placeholder="Subtitle (e.g. dates)"
                      style={{ ...s, marginBottom: 0, flex: 1, padding: "6px 8px", fontSize: 12 }} />
                  </div>
                  <button onClick={() => movePhase(i, -1)} style={smallBtn()} title="Move up">↑</button>
                  <button onClick={() => movePhase(i, 1)} style={smallBtn()} title="Move down">↓</button>
                  <button onClick={() => removePhase(i)} style={smallBtn(t.danger)} title="Remove">×</button>
                </div>
              ))}
              <button onClick={addPhase} style={{
                width: "100%", padding: 8, background: "transparent", border: `1px dashed ${t.border}`,
                borderRadius: 7, color: t.muted, cursor: "pointer", fontSize: 12, fontFamily: "inherit", marginTop: 4,
              }}>+ Add Phase</button>
            </>
          )}
        </div>

        <button onClick={onClose} style={{
          padding: 9, background: t.accent, border: "none", borderRadius: 7,
          color: t.accentText, cursor: "pointer", fontWeight: 700, fontSize: 12.5, fontFamily: "inherit",
        }}>Done</button>
      </div>
    </div>
  );
}
