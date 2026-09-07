import { useState } from "react";
import { TRACK_COLORS, inp as inpFn } from "../constants";
import { uid } from "../utils";

export default function ScratchPad({ scratch, setScratch, scratchInput, setScratchInput, categories, setCategories, t }) {
  const s = inpFn(t);
  const [editingCat, setEditingCat] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editText, setEditText] = useState("");

  const addScratch = () => {
    if (!scratchInput.text.trim()) return;
    setScratch([...scratch, { id: uid(), category: scratchInput.category, text: scratchInput.text }]);
    setScratchInput({ ...scratchInput, text: "" });
  };

  const addCategory = () => {
    const color = TRACK_COLORS[categories.length % TRACK_COLORS.length];
    const newCat = { id: uid(), label: "New Category", color };
    setCategories([...categories, newCat]);
  };

  const updateCategoryLabel = (catId, label) => {
    setCategories(categories.map(c => c.id === catId ? { ...c, label } : c));
  };

  const removeCategory = (catId) => {
    setCategories(categories.filter(c => c.id !== catId));
    setScratch(scratch.filter(sc => sc.category !== catId));
  };

  const startEditItem = (item) => {
    setEditingItem(item.id);
    setEditText(item.text);
  };

  const saveEditItem = (itemId) => {
    if (editText.trim()) {
      setScratch(scratch.map(sc => sc.id === itemId ? { ...sc, text: editText.trim() } : sc));
    }
    setEditingItem(null);
  };

  return (
    <div style={{ padding: "20px 28px" }}>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: "16px 18px", marginBottom: 18 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: t.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Drop something in</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={scratchInput.category} onChange={e => setScratchInput({ ...scratchInput, category: e.target.value })}
            style={{ ...s, width: "auto", flex: "0 0 180px", marginBottom: 0 }}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <input placeholder="Idea, book, person, thought..." value={scratchInput.text}
            onChange={e => setScratchInput({ ...scratchInput, text: e.target.value })}
            onKeyDown={e => e.key === "Enter" && addScratch()}
            style={{ ...s, flex: 1, minWidth: 160, marginBottom: 0 }} />
          <button onClick={addScratch} style={{ padding: "8px 18px", background: t.accent, border: "none", borderRadius: 6, color: t.accentText, cursor: "pointer", fontWeight: 700, fontFamily: "inherit", fontSize: 12 }}>Add</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {categories.map(cat => {
          const catItems = scratch.filter(sc => sc.category === cat.id);
          return (
            <div key={cat.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderTop: `3px solid ${cat.color}`, borderRadius: 10 }}>
              <div style={{ padding: "11px 14px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                {editingCat === cat.id ? (
                  <input
                    autoFocus
                    value={cat.label}
                    onChange={e => updateCategoryLabel(cat.id, e.target.value)}
                    onBlur={() => setEditingCat(null)}
                    onKeyDown={e => { if (e.key === "Enter") setEditingCat(null); if (e.key === "Escape") setEditingCat(null); }}
                    style={{ ...s, marginBottom: 0, padding: "4px 6px", fontSize: 12, fontWeight: 700, flex: 1 }}
                  />
                ) : (
                  <span
                    onDoubleClick={() => setEditingCat(cat.id)}
                    style={{ fontSize: 12, fontWeight: 700, color: t.text, cursor: "text", flex: 1 }}
                    title="Double-click to rename"
                  >{cat.label}</span>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: t.muted, background: t.faint, padding: "1px 7px", borderRadius: 10, fontWeight: 600 }}>{catItems.length}</span>
                  <button onClick={() => removeCategory(cat.id)} style={{ background: "none", border: "none", color: t.muted, cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1, fontFamily: "inherit" }} title="Remove category">×</button>
                </div>
              </div>
              <div style={{ padding: "8px 10px" }}>
                {catItems.length === 0 && <div style={{ fontSize: 12, color: t.faint, textAlign: "center", padding: "10px 0" }}>—</div>}
                {catItems.map(item => (
                  <div key={item.id} className="scratch-item-enter" style={{ padding: "8px 10px", marginBottom: 5, background: t.card, border: `1px solid ${t.border}`, borderLeft: `3px solid ${cat.color}`, borderRadius: 7, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    {editingItem === item.id ? (
                      <input
                        autoFocus
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onBlur={() => saveEditItem(item.id)}
                        onKeyDown={e => { if (e.key === "Enter") saveEditItem(item.id); if (e.key === "Escape") setEditingItem(null); }}
                        style={{ ...s, marginBottom: 0, padding: "2px 6px", fontSize: 12.5, flex: 1 }}
                      />
                    ) : (
                      <span
                        onDoubleClick={() => startEditItem(item)}
                        style={{ fontSize: 12.5, fontWeight: 500, color: t.text, flex: 1, lineHeight: 1.5, cursor: "text" }}
                        title="Double-click to edit"
                      >{item.text}</span>
                    )}
                    <button onClick={() => setScratch(scratch.filter(sc => sc.id !== item.id))} style={{ background: "none", border: "none", color: t.faint, cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0, fontFamily: "inherit" }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Add category card */}
        <div
          onClick={addCategory}
          style={{
            background: "transparent", border: `1px dashed ${t.border}`, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", minHeight: 100, color: t.muted, fontSize: 12, fontWeight: 600,
            transition: "border-color 0.12s",
          }}
        >
          + Add Category
        </div>
      </div>
    </div>
  );
}
