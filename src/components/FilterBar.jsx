import { useState } from "react";
import { STATUSES, inp as inpFn } from "../constants";
import useMediaQuery from "../hooks/useMediaQuery";

export default function FilterBar({ searchQuery, setSearchQuery, phaseFilter, setPhaseFilter, trackFilter, setTrackFilter, statusFilter, setStatusFilter, visibleCount, totalCount, tracks, phases, t }) {
  const isPhone = useMediaQuery("(max-width: 640px)");
  const [open, setOpen] = useState(false);

  const hasFilters = searchQuery || phaseFilter || trackFilter || statusFilter;
  const activeCount = [phaseFilter, trackFilter, statusFilter].filter(Boolean).length;

  const s = inpFn(t);
  const sel = { ...s, width: "auto", flex: "0 0 auto", marginBottom: 0, cursor: "pointer", minWidth: 120, padding: "7px 10px", fontSize: 12 };
  // On a phone the three selects get their own row and share it equally,
  // rather than pushing the board off the bottom of the screen.
  const phoneSel = { ...s, marginBottom: 0, cursor: "pointer", flex: "1 1 0", minWidth: 0, padding: "8px 6px", fontSize: 12 };

  const clear = () => { setSearchQuery(""); setPhaseFilter(null); setTrackFilter(null); setStatusFilter(null); };

  const selects = (style) => (
    <>
      <select value={phaseFilter || ""} onChange={e => setPhaseFilter(e.target.value || null)} style={style}>
        <option value="">All phases</option>
        {phases.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
      <select value={trackFilter || ""} onChange={e => setTrackFilter(e.target.value || null)} style={style}>
        <option value="">All tracks</option>
        {tracks.map(tr => <option key={tr.id} value={tr.id}>{tr.label}</option>)}
      </select>
      <select value={statusFilter || ""} onChange={e => setStatusFilter(e.target.value || null)} style={style}>
        <option value="">All statuses</option>
        {STATUSES.map(st => <option key={st.id} value={st.id}>{st.label}</option>)}
      </select>
    </>
  );

  const btn = {
    padding: "8px 12px", background: "transparent", border: `1px solid ${t.border}`,
    borderRadius: 6, color: t.muted, cursor: "pointer", fontSize: 11, fontWeight: 600,
    fontFamily: "inherit", flexShrink: 0,
  };

  if (isPhone) {
    return (
      <div style={{ padding: "8px 16px", borderBottom: `1px solid ${t.border}`, background: t.surface }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ ...s, flex: "1 1 auto", marginBottom: 0, minWidth: 0, padding: "8px 10px" }}
          />
          <button
            onClick={() => setOpen(o => !o)}
            style={{ ...btn, color: activeCount ? t.text : t.muted, borderColor: activeCount ? t.borderHover : t.border }}
          >
            Filters{activeCount ? ` · ${activeCount}` : ""}
          </button>
        </div>

        {open && (
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {selects(phoneSel)}
          </div>
        )}

        {hasFilters && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
            <button onClick={clear} style={{ ...btn, padding: "5px 10px" }}>Clear</button>
            <span style={{ fontSize: 11, color: t.muted }}>{visibleCount} / {totalCount}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 28px", borderBottom: `1px solid ${t.border}`, background: t.surface, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <input
        placeholder="Search..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        style={{ ...s, flex: "1 1 160px", marginBottom: 0, minWidth: 140, padding: "7px 10px", fontSize: 12 }}
      />
      {selects(sel)}
      {hasFilters && (
        <>
          <button onClick={clear} style={{ ...btn, padding: "6px 12px" }}>Clear</button>
          <span style={{ fontSize: 11, color: t.muted }}>{visibleCount} / {totalCount}</span>
        </>
      )}
    </div>
  );
}
