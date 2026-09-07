export function uid() {
  return Math.random().toString(36).substr(2, 9);
}


export function migrateItems(items) {
  return items.map(item => ({
    ...item,
    status: item.status || "todo",
  }));
}

export function exportData(items, scratch, tracks, phases, scratchCategories) {
  const data = { items, scratch, tracks, phases, scratchCategories, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `roadmap-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.items || !Array.isArray(data.items)) {
          reject(new Error("Invalid backup file"));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

const MAX_HISTORY = 50;

export function createHistoryManager(initialState) {
  return {
    past: [],
    present: initialState,
    future: [],
  };
}

export function pushHistory(history, newPresent) {
  return {
    past: [...history.past.slice(-(MAX_HISTORY - 1)), history.present],
    present: newPresent,
    future: [],
  };
}

export function undo(history) {
  if (history.past.length === 0) return history;
  const previous = history.past[history.past.length - 1];
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redo(history) {
  if (history.future.length === 0) return history;
  const next = history.future[0];
  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
  };
}

export function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((date - today) / (1000 * 60 * 60 * 24));
  const formatted = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  if (diff < 0) return { text: formatted, overdue: true };
  if (diff === 0) return { text: "Today", overdue: false };
  if (diff === 1) return { text: "Tomorrow", overdue: false };
  if (diff <= 7) return { text: `${diff}d`, overdue: false };
  return { text: formatted, overdue: false };
}
