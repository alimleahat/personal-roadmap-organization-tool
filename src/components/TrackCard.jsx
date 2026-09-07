import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import ItemCard from "./ItemCard";

export default function TrackCard({ track, items, phases, onItemClick, onAddItem, hovered, setHovered, dimmed, t }) {
  const { setNodeRef, isOver } = useDroppable({ id: track.id });

  const doneCount = items.filter(i => i.status === "done").length;
  const progress = items.length > 0 ? doneCount / items.length : 0;

  return (
    <div ref={setNodeRef} style={{
      background: t.surface,
      border: `1px solid ${isOver ? track.color : t.border}`,
      borderRadius: 10,
      overflow: "hidden",
      // On a phone the columns are swipeable, so each needs its own height
      // rather than stretching the whole row to the tallest track.
      alignSelf: "flex-start",
      width: "100%",
      opacity: dimmed ? 0.35 : 1,
      transition: "opacity 0.2s, border-color 0.15s, box-shadow 0.15s",
      boxShadow: isOver ? `0 0 0 1px ${track.color}44, 0 0 16px ${track.color}22` : "none",
    }}>
      <div style={{
        padding: "11px 14px",
        borderBottom: `1px solid ${t.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: track.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: t.muted, background: t.faint, padding: "1px 8px", borderRadius: 10, fontWeight: 600 }}>{items.length}</span>
          <button
            onClick={onAddItem}
            title={`Add item to ${track.label}`}
            style={{
              width: 26, height: 26, borderRadius: 6, border: "none",
              background: "transparent", color: t.muted, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, lineHeight: 1, padding: 0, fontFamily: "inherit",
              transition: "color 0.12s, background 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = track.color; e.currentTarget.style.background = t.faint; }}
            onMouseLeave={e => { e.currentTarget.style.color = t.muted; e.currentTarget.style.background = "transparent"; }}
          >+</button>
        </div>
      </div>

      {items.length > 0 && (
        <div style={{ height: 2, background: t.faint }}>
          <div style={{ height: "100%", width: `${progress * 100}%`, background: "#22C55E", transition: "width 0.3s", borderRadius: 1 }} />
        </div>
      )}

      <div style={{ padding: "8px 8px", minHeight: 36 }}>
        {items.length === 0 && (
          <div style={{ fontSize: 12, color: t.faint, textAlign: "center", padding: "10px 0" }}>—</div>
        )}
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              phase={phases.find(p => p.id === item.phase)}
              trackColor={track.color}
              onClick={() => onItemClick(item)}
              hovered={hovered === item.id}
              onHover={() => setHovered(item.id)}
              onLeave={() => setHovered(null)}
              t={t}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
