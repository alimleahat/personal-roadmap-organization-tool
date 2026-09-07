import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { STATUSES } from "../constants";
import { formatDueDate } from "../utils";

const statusColor = (status) => STATUSES.find(s => s.id === status)?.color || "#666";

export default function ItemCard({ item, phase, trackColor, onClick, hovered, onHover, onLeave, t }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { item },
  });

  const due = formatDueDate(item.dueDate);

  const style = {
    padding: "9px 12px", marginBottom: 6,
    background: hovered ? t.cardHover : t.card,
    border: `1px solid ${hovered ? t.borderHover : t.border}`,
    borderRadius: 8, cursor: "grab", transition: isDragging ? "none" : (transition || "all 0.12s"),
    WebkitTouchCallout: "none",
    opacity: isDragging ? 0.3 : item.status === "done" ? 0.45 : 1,
    transform: CSS.Transform.toString(transform),
  };

  const handleClick = (e) => {
    if (transform && (Math.abs(transform.x) > 3 || Math.abs(transform.y) > 3)) return;
    onClick(e);
  };

  return (
    <div ref={setNodeRef} className="item-enter item-card" {...attributes} {...listeners} onClick={handleClick} onMouseEnter={onHover} onMouseLeave={onLeave} style={style}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
        {item.status !== "todo" && (
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor(item.status), flexShrink: 0, marginTop: 5 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12.5, fontWeight: 600, color: t.text, lineHeight: 1.4,
            textDecoration: item.status === "done" ? "line-through" : "none",
            opacity: item.status === "done" ? 0.7 : 1,
          }}>{item.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            {phase && (
              <span style={{ fontSize: 10.5, color: trackColor, fontWeight: 500, opacity: 0.8 }}>{phase.label}</span>
            )}
            {due && (
              <span style={{ fontSize: 10, color: due.overdue ? "#EF4444" : t.muted, fontWeight: due.overdue ? 600 : 500 }}>{due.text}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
