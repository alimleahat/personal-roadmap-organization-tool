import { useState, useEffect, useCallback, useRef } from "react";
import { DndContext, DragOverlay, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { DEFAULT_TRACKS, DEFAULT_PHASES, INITIAL_ITEMS, INITIAL_SCRATCH, SCRATCH_CATEGORIES, themes } from "./constants";
import { uid, migrateItems, exportData, importData, pushHistory, undo, redo, createHistoryManager } from "./utils";
import TrackCard from "./components/TrackCard";
import DetailModal from "./components/DetailModal";
import AddModal from "./components/AddModal";
import FilterBar from "./components/FilterBar";
import ScratchPad from "./components/ScratchPad";
import SettingsModal from "./components/SettingsModal";
import ItemCard from "./components/ItemCard";
import PasscodeGate from "./components/PasscodeGate";
import SyncStatus from "./components/SyncStatus";
import useMediaQuery from "./hooks/useMediaQuery";
import { loadData, saveData, flushPending, cachedData, diagnose } from "./api";
import { BOARD_OWNER, BOARD_PERIOD } from "./config";

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [locked, setLocked] = useState(false);
  const [sync, setSync] = useState("synced");
  // False until we know what is already stored. Guards against the app
  // committing its built-in defaults over a real roadmap it failed to load.
  const [canSave, setCanSave] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [diag, setDiag] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState("board");
  const [theme, setThemeRaw] = useState(() => cachedData()?.theme ?? "dark");
  const [tracks, setTracksRaw] = useState(DEFAULT_TRACKS);
  const [phases, setPhasesRaw] = useState(DEFAULT_PHASES);
  const [history, setHistory] = useState(() => createHistoryManager(INITIAL_ITEMS));
  const [scratch, setScratchRaw] = useState(INITIAL_SCRATCH);
  const [scratchCategories, setScratchCategoriesRaw] = useState(SCRATCH_CATEGORIES);
  const [phaseFilter, setPhaseFilter] = useState(null);
  const [trackFilter, setTrackFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", note: "", track: "", phase: "", dueDate: null });
  const [scratchInput, setScratchInput] = useState({ category: "ideas", text: "" });
  const [hovered, setHovered] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const fileRef = useRef(null);
  const saveTimer = useRef(null);
  // Only a user edit should ever trigger a write. Without this the save effect
  // fires on first render and re-commits the data it has just loaded.
  const dirty = useRef(false);

  const items = history.present;
  const t = themes[theme];
  const isPhone = useMediaQuery("(max-width: 640px)");

  // Load on startup: server first, falling back to the local cache so the app
  // still opens with real data when there is no signal.
  const applyData = useCallback((data) => {
    if (!data || !data.items) return;
    setHistory(createHistoryManager(migrateItems(data.items)));
    if (data.scratch) setScratchRaw(data.scratch);
    if (data.tracks) setTracksRaw(data.tracks);
    if (data.phases) setPhasesRaw(data.phases);
    if (data.scratchCategories) setScratchCategoriesRaw(data.scratchCategories);
    if (data.theme) setThemeRaw(data.theme);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadData().then((result) => {
      const { data, source, locked: isLocked } = result;
      if (cancelled) return;
      applyData(data);
      setLocked(isLocked);

      // Saving is safe when we actually know the stored state: either the
      // server answered (even with an empty store, which means first run), or
      // we have a local cache of a roadmap we loaded successfully before.
      const known = !result.suspect && (source === "network" || Boolean(data && data.items));
      setCanSave(known);
      setLoadFailed(!known && !isLocked);
      setLoadError(result.error || "");
      setSync(source === "network" ? "synced" : "pending");
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [applyData]);

  // Flag the unsaved state from the event that caused it, not from an effect
  // reacting to it — the indicator then flips the instant you make a change.
  const markDirty = useCallback(() => {
    dirty.current = true;
    setSync("saving");
  }, []);

  const setItems = useCallback((newItems) => {
    markDirty();
    const next = typeof newItems === "function" ? newItems(history.present) : newItems;
    setHistory(h => pushHistory(h, next));
  }, [history.present, markDirty]);

  const setTracks = (newTracks) => { markDirty(); setTracksRaw(newTracks); };
  const setPhases = (newPhases) => { markDirty(); setPhasesRaw(newPhases); };
  const setScratch = (next) => { markDirty(); setScratchRaw(next); };
  const setScratchCategories = (next) => { markDirty(); setScratchCategoriesRaw(next); };
  const setTheme = (next) => { markDirty(); setThemeRaw(next); };

  // Auto-save (debounced). Each save is a commit to GitHub, so the delay is a
  // little longer than the old local-file write to avoid a commit per keystroke.
  const saveToServer = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const payload = { items: history.present, scratch, tracks, phases, scratchCategories, theme };
      const { synced, locked: isLocked } = await saveData(payload);
      if (isLocked) setLocked(true);
      setSync(synced ? "synced" : "pending");
    }, 1200);
  }, [history.present, scratch, tracks, phases, scratchCategories, theme]);

  useEffect(() => {
    if (loaded && canSave && dirty.current) saveToServer();
  }, [saveToServer, loaded, canSave]);

  // Flush anything written while offline as soon as we are back.
  useEffect(() => {
    const retry = async () => {
      if (!navigator.onLine || !canSave) return;
      const { synced } = await flushPending();
      setSync(synced ? "synced" : "pending");
    };
    const onVisible = () => { if (document.visibilityState === "visible") retry(); };
    window.addEventListener("online", retry);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", retry);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [canSave]);

  // Last line of defence against a closed tab eating an in-flight edit.
  useEffect(() => {
    const warn = (e) => {
      if (sync === "saving" || sync === "pending") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [sync]);

  // Keep modal in sync
  useEffect(() => {
    if (modal) {
      const updated = items.find(i => i.id === modal.id);
      if (updated) setModal(updated);
    }
  }, [items]);

  // Undo/redo keyboard
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        setHistory(h => undo(h));
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "Z" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        setHistory(h => redo(h));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // On touch a 5px move is a scroll, not a drag. Requiring a short press
    // first keeps the board scrollable while still allowing drag-and-drop.
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const visible = items.filter(i => {
    if (phaseFilter && i.phase !== phaseFilter) return false;
    if (trackFilter && i.track !== trackFilter) return false;
    if (statusFilter && i.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!i.title.toLowerCase().includes(q) && !(i.note || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const hasFilters = searchQuery || phaseFilter || trackFilter || statusFilter;

  const addItem = () => {
    if (!newItem.title || !newItem.track || !newItem.phase) return;
    setItems([...items, { id: uid(), ...newItem, status: "todo" }]);
    setNewItem({ title: "", note: "", track: "", phase: "", dueDate: null });
    setShowAdd(false);
  };

  const updateItem = (updated) => {
    setItems(items.map(i => i.id === updated.id ? updated : i));
  };

  const deleteItem = (id) => {
    setItems(items.filter(i => i.id !== id));
    setModal(null);
  };

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || !active) return;

    const activeItem = items.find(i => i.id === active.id);
    if (!activeItem) return;

    const overIsTrack = tracks.find(tr => tr.id === over.id);
    const overItem = !overIsTrack ? items.find(i => i.id === over.id) : null;
    const targetTrack = overIsTrack ? over.id : (overItem?.track ?? activeItem.track);

    if (targetTrack === activeItem.track && overItem) {
      // Same track: reorder
      const trackItems = items.filter(i => i.track === targetTrack);
      const oldIndex = trackItems.findIndex(i => i.id === active.id);
      const newIndex = trackItems.findIndex(i => i.id === over.id);
      if (oldIndex !== newIndex) {
        const reordered = arrayMove(trackItems, oldIndex, newIndex);
        const otherItems = items.filter(i => i.track !== targetTrack);
        setItems([...otherItems, ...reordered]);
      }
    } else {
      // Cross-track move
      setItems(prev => prev.map(i => i.id === active.id ? { ...i, track: targetTrack } : i));
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importData(file);
      setItems(migrateItems(data.items));
      if (data.scratch) setScratchRaw(data.scratch);
      if (data.tracks) setTracksRaw(data.tracks);
      if (data.phases) setPhasesRaw(data.phases);
      if (data.scratchCategories) setScratchCategoriesRaw(data.scratchCategories);
    } catch (err) {
      alert(err.message);
    }
    e.target.value = "";
  };

  const draggedItem = activeId ? items.find(i => i.id === activeId) : null;
  const doneCount = items.filter(i => i.status === "done").length;

  const headerBtn = (extra) => ({
    padding: "5px 12px", background: "transparent", border: `1px solid ${t.border}`,
    borderRadius: 6, color: t.muted, cursor: "pointer", fontSize: 11, fontWeight: 600,
    fontFamily: "inherit", transition: "color 0.12s", ...extra,
  });

  // Until the initial load resolves we do not know whether to show the board,
  // the passcode gate, or the failure banner. Rendering the board immediately
  // means every refresh flashes the built-in defaults for a moment.
  if (!loaded) {
    return (
      <div style={{
        minHeight: "100dvh", background: t.bg, color: t.muted,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
      }}>
        Roadmap
      </div>
    );
  }

  if (locked) {
    return <PasscodeGate onUnlock={() => window.location.reload()} />;
  }

  const pad = isPhone ? 16 : 28;

  const secondaryActions = (
    <>
      <button onClick={() => exportData(items, scratch, tracks, phases, scratchCategories)} style={headerBtn()}>Export</button>
      <button onClick={() => fileRef.current?.click()} style={headerBtn()}>Import</button>
      <button onClick={() => { setShowSettings(true); setMenuOpen(false); }} style={headerBtn()}>Settings</button>
      <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={headerBtn()} title="Toggle theme">
        {theme === "dark" ? "☀" : "☾"}
      </button>
    </>
  );

  return (
    <div style={{ minHeight: "100dvh", background: t.bg, color: t.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: 14 }}>

      {/* Header */}
      <div style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, padding: `${isPhone ? 10 : 14}px ${pad}px`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, color: t.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 2, display: "flex", alignItems: "center", gap: 8 }}>
            <span>{BOARD_OWNER}</span>
            <SyncStatus state={sync} t={t} />
          </div>
          <div style={{ fontSize: isPhone ? 16 : 20, fontWeight: 800, letterSpacing: -0.5, color: t.text, whiteSpace: "nowrap" }}>{BOARD_PERIOD}</div>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          <button onClick={() => setHistory(h => undo(h))} disabled={history.past.length === 0} style={headerBtn({ opacity: history.past.length ? 1 : 0.3, minWidth: isPhone ? 36 : undefined, textAlign: "center" })} title="Undo (Ctrl+Z)">↩</button>
          <button onClick={() => setHistory(h => redo(h))} disabled={history.future.length === 0} style={headerBtn({ opacity: history.future.length ? 1 : 0.3, minWidth: isPhone ? 36 : undefined, textAlign: "center" })} title="Redo (Ctrl+Shift+Z)">↪</button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />

          {isPhone ? (
            <button onClick={() => setMenuOpen(o => !o)} style={headerBtn({ minWidth: 36, textAlign: "center" })} title="More">⋯</button>
          ) : (
            <>
              <div style={{ width: 1, height: 20, background: t.border, margin: "0 4px" }} />
              {secondaryActions}
            </>
          )}
        </div>
      </div>

      {loadFailed && (
        <div style={{
          background: "#7F1D1D", color: "#FEE2E2", padding: `10px ${pad}px`,
          fontSize: 12, lineHeight: 1.5,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            Couldn't load your roadmap — editing is disabled so this can't overwrite it.
          </div>
          {loadError && (
            <div style={{ opacity: 0.9, marginBottom: 6, fontFamily: "ui-monospace, monospace", fontSize: 11 }}>
              {loadError}
            </div>
          )}
          <button
            onClick={async () => setDiag(await diagnose())}
            style={{
              padding: "5px 10px", border: "1px solid #FCA5A5", borderRadius: 6,
              color: "#FEE2E2", fontSize: 11, fontWeight: 600, fontFamily: "inherit",
            }}
          >
            Check settings
          </button>
          {diag && (
            <pre style={{
              marginTop: 8, marginBottom: 0, padding: 10, background: "#00000055",
              borderRadius: 6, fontSize: 11, lineHeight: 1.5, overflowX: "auto",
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>{JSON.stringify(diag, null, 2)}</pre>
          )}
        </div>
      )}

      {isPhone && menuOpen && (
        <div style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, padding: `8px ${pad}px`, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {secondaryActions}
        </div>
      )}

      {/* Tab bar */}
      <div style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, padding: `0 ${pad}px`, display: "flex", gap: 2 }}>
        {[["board", "Roadmap"], ["scratch", "Scratch Pad"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: "10px 16px", background: "none", border: "none",
            borderBottom: tab === id ? `2px solid ${t.text}` : "2px solid transparent",
            color: tab === id ? t.text : t.muted, cursor: "pointer",
            fontSize: 11.5, fontWeight: 600, letterSpacing: 0.3,
            fontFamily: "inherit", transition: "color 0.12s",
          }}>{label}</button>
        ))}
      </div>

      {tab === "board" && (
        <div key="board" className="tab-content-enter">
          <FilterBar
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            phaseFilter={phaseFilter} setPhaseFilter={setPhaseFilter}
            trackFilter={trackFilter} setTrackFilter={setTrackFilter}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            visibleCount={visible.length} totalCount={items.length}
            tracks={tracks} phases={phases} t={t}
          />

          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div style={{ padding: `12px ${pad}px` }}>
              <div className="board-grid">
                {tracks.map(track => {
                  const trackItems = visible.filter(i => i.track === track.id);
                  const dimmed = hasFilters && trackItems.length === 0;
                  return (
                    <TrackCard
                      key={track.id}
                      track={track}
                      items={trackItems}
                      phases={phases}
                      onItemClick={setModal}
                      onAddItem={() => {
                        setNewItem({ title: "", note: "", track: track.id, phase: "", dueDate: null });
                        setShowAdd(true);
                      }}
                      hovered={hovered}
                      setHovered={setHovered}
                      dimmed={dimmed}
                      t={t}
                    />
                  );
                })}
              </div>
            </div>

            <DragOverlay>
              {draggedItem ? (
                <div style={{ transform: "scale(1.04)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)", borderRadius: 8 }}>
                  <ItemCard
                    item={draggedItem}
                    phase={phases.find(p => p.id === draggedItem.phase)}
                    trackColor={tracks.find(tr => tr.id === draggedItem.track)?.color}
                    onClick={() => {}} hovered={false} onHover={() => {}} onLeave={() => {}}
                    t={t}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {showAdd && (
            <AddModal newItem={newItem} setNewItem={setNewItem} tracks={tracks} phases={phases} onAdd={addItem} onClose={() => setShowAdd(false)} t={t} />
          )}

          {modal && (
            <DetailModal item={modal} tracks={tracks} phases={phases} onClose={() => setModal(null)} onDelete={() => deleteItem(modal.id)} onUpdateItem={updateItem} t={t} />
          )}
        </div>
      )}

      {tab === "scratch" && (
        <div key="scratch" className="tab-content-enter">
          <ScratchPad scratch={scratch} setScratch={setScratch} scratchInput={scratchInput} setScratchInput={setScratchInput} categories={scratchCategories} setCategories={setScratchCategories} t={t} />
        </div>
      )}

      {showSettings && (
        <SettingsModal tracks={tracks} setTracks={setTracks} phases={phases} setPhases={setPhases} onClose={() => setShowSettings(false)} t={t} />
      )}

      {/* Footer */}
      <div style={{ padding: `12px ${pad}px`, borderTop: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10.5, color: t.muted }}>{items.length} items · {doneCount} done · {tracks.length} tracks · {phases.length} phases</span>
        <SyncStatus state={sync} t={t} />
      </div>
    </div>
  );
}
