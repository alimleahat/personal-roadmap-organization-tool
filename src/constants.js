export const DEFAULT_TRACKS = [
  { id: "work", label: "Work", color: "#3B82F6" },
  { id: "learning", label: "Learning", color: "#8B5CF6" },
  { id: "projects", label: "Side Projects", color: "#10B981" },
  { id: "health", label: "Health & Fitness", color: "#F59E0B" },
  { id: "personal", label: "Personal", color: "#EC4899" },
];

export const DEFAULT_PHASES = [
  { id: "now", label: "Now", sub: "This month" },
  { id: "next", label: "Next", sub: "Next 3 months" },
  { id: "later", label: "Later", sub: "This year" },
  { id: "someday", label: "Someday", sub: "No date yet" },
];

export const SCRATCH_CATEGORIES = [
  { id: "ideas", label: "Ideas", color: "#F59E0B" },
  { id: "reading", label: "Reading List", color: "#3B82F6" },
  { id: "people", label: "People to Contact", color: "#10B981" },
  { id: "notes", label: "Notes", color: "#EC4899" },
];

// Sample content, shown until you add your own. Everything here is editable
// in the app: add and rename tracks and phases in Settings, then delete these.
export const INITIAL_ITEMS = [
  { id: "d1", track: "work", phase: "now", title: "Finish the quarterly review", note: "Pull the numbers first, then write the summary.", status: "in-progress" },
  { id: "d2", track: "work", phase: "now", title: "Hand over the onboarding doc", status: "todo" },
  { id: "d3", track: "work", phase: "next", title: "Plan next quarter's roadmap", note: "Block out a half day for this.", status: "todo" },
  { id: "d4", track: "learning", phase: "now", title: "Work through a SQL course", note: "Two evenings a week.", status: "in-progress" },
  { id: "d5", track: "learning", phase: "next", title: "Read one book a month", status: "todo" },
  { id: "d6", track: "learning", phase: "later", title: "Give a talk at a meetup", note: "Pick a topic from something already built.", status: "todo" },
  { id: "d7", track: "projects", phase: "now", title: "Ship the first version", note: "Cut scope until it fits a weekend.", status: "todo" },
  { id: "d8", track: "projects", phase: "next", title: "Write up what was learned", status: "todo" },
  { id: "d9", track: "projects", phase: "someday", title: "Open source a small library", status: "todo" },
  { id: "d10", track: "health", phase: "now", title: "Settle into a training routine", note: "Three sessions a week, same days each week.", status: "done" },
  { id: "d11", track: "health", phase: "next", title: "Sign up for a 10k", status: "todo" },
  { id: "d12", track: "health", phase: "now", title: "Sort out a proper sleep schedule", status: "blocked" },
  { id: "d13", track: "personal", phase: "now", title: "Book the trip", note: "Compare dates before the prices climb.", status: "todo" },
  { id: "d14", track: "personal", phase: "later", title: "Learn to cook five good meals", status: "todo" },
];

export const INITIAL_SCRATCH = [
  { id: "s1", category: "ideas", text: "A tool that turns meeting notes into action items" },
  { id: "s2", category: "ideas", text: "Weekly review template worth actually using" },
  { id: "s3", category: "reading", text: "Thinking in Systems — Donella Meadows" },
  { id: "s4", category: "reading", text: "The Making of a Manager — Julie Zhuo" },
  { id: "s5", category: "people", text: "Reconnect with the team from the last project" },
  { id: "s6", category: "notes", text: "Anything sitting here for a month is probably a no" },
];

export const STATUSES = [
  { id: "todo", label: "To Do", color: "#666" },
  { id: "in-progress", label: "In Progress", color: "#F59E0B" },
  { id: "done", label: "Done", color: "#22C55E" },
  { id: "blocked", label: "Blocked", color: "#EF4444" },
];

export const TRACK_COLORS = [
  "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EC4899", "#06B6D4",
  "#22C55E", "#EF4444", "#6366F1", "#A855F7", "#EAB308", "#14B8A6",
  "#38BDF8", "#4ADE80", "#F97316", "#84CC16", "#E879F9", "#FB7185",
];

export const themes = {
  dark: {
    bg: "#0F0F0F",
    surface: "#181818",
    surfaceHover: "#1E1E1E",
    card: "#161616",
    cardHover: "#1C1C1C",
    border: "#262626",
    borderHover: "#363636",
    text: "#EAEAEA",
    textSecondary: "#A0A0A0",
    muted: "#606060",
    faint: "#2A2A2A",
    input: "#111111",
    overlay: "#000000CC",
    accent: "#EAEAEA",
    accentText: "#111111",
    danger: "#EF4444",
    dangerBorder: "#7F1D1D",
  },
  light: {
    bg: "#F5F5F5",
    surface: "#FFFFFF",
    surfaceHover: "#FAFAFA",
    card: "#FFFFFF",
    cardHover: "#F8F8F8",
    border: "#E2E2E2",
    borderHover: "#D0D0D0",
    text: "#1A1A1A",
    textSecondary: "#555555",
    muted: "#888888",
    faint: "#E8E8E8",
    input: "#F0F0F0",
    overlay: "#00000066",
    accent: "#1A1A1A",
    accentText: "#FFFFFF",
    danger: "#EF4444",
    dangerBorder: "#FECACA",
  },
};

export const inp = (t) => ({
  width: "100%", padding: "9px 12px", background: t.input,
  border: `1px solid ${t.border}`, borderRadius: 6,
  color: t.text, fontSize: 13, fontFamily: "inherit",
  outline: "none", boxSizing: "border-box", marginBottom: 10,
});
