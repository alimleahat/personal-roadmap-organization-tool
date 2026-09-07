// Client side of the data API.
//
// Every successful load and save also writes to localStorage, so the app opens
// with your real roadmap even with no signal. Saves made offline are held and
// flushed the moment the network comes back — closing the tab mid-flight does
// not lose them, because the pending payload is on disk too.

const CACHE_KEY = "roadmap:cache";
const PENDING_KEY = "roadmap:pending";
const PASSCODE_KEY = "roadmap:passcode";

export function getPasscode() {
  try {
    return localStorage.getItem(PASSCODE_KEY) || "";
  } catch {
    return "";
  }
}

export function setPasscode(value) {
  try {
    if (value) localStorage.setItem(PASSCODE_KEY, value);
    else localStorage.removeItem(PASSCODE_KEY);
  } catch { /* private browsing */ }
}

function headers() {
  const h = { "Content-Type": "application/json" };
  const key = getPasscode();
  if (key) h["x-roadmap-key"] = key;
  return h;
}

function readLocal(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota or private browsing */ }
}

export function cachedData() {
  return readLocal(CACHE_KEY);
}

export function hasPending() {
  return readLocal(PENDING_KEY) !== null;
}

/**
 * Fetch the roadmap.
 * @returns {Promise<{data: object|null, source: "network"|"cache", locked: boolean}>}
 */
export async function loadData() {
  try {
    const res = await fetch("/api/data", { headers: headers(), cache: "no-store" });

    if (res.status === 401) {
      return { data: cachedData(), source: "cache", locked: true, error: "" };
    }

    if (!res.ok) {
      // Carry the server's own explanation up to the UI. A silent "couldn't
      // reach it" leaves you guessing at which of five settings is wrong.
      const body = await res.json().catch(() => ({}));
      throw new Error(body.hint || body.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && data.items) {
      writeLocal(CACHE_KEY, data);
      return { data, source: "network", locked: false, error: "" };
    }

    // The server answered, but with an empty roadmap. On a fresh install that
    // is correct. If this device has a saved copy with real content, it is
    // not — it means storage is misconfigured, and letting the app carry on
    // would save the built-in defaults over the real thing.
    const cache = cachedData();
    if (cache && cache.items && cache.items.length > 0) {
      return {
        data: cache,
        source: "cache",
        locked: false,
        suspect: true,
        error: "The server returned an empty roadmap, but this device has a saved copy. Storage is probably misconfigured — editing is disabled so it can't overwrite your data.",
      };
    }

    return { data, source: "network", locked: false, error: "" };
  } catch (err) {
    return { data: cachedData(), source: "cache", locked: false, error: err.message };
  }
}

/**
 * Ask the server which storage settings it can actually see. Reports presence
 * only — never values — so it is safe to surface in the UI.
 */
export async function diagnose() {
  try {
    const res = await fetch("/api/data?diag=1", { headers: headers(), cache: "no-store" });
    return await res.json();
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Persist the roadmap. Always succeeds locally; reports whether it reached the
 * server so the UI can show a "pending" state.
 * @returns {Promise<{synced: boolean, locked: boolean}>}
 */
export async function saveData(payload) {
  writeLocal(CACHE_KEY, payload);

  try {
    const res = await fetch("/api/data", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      writeLocal(PENDING_KEY, payload);
      return { synced: false, locked: true };
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    writeLocal(PENDING_KEY, null);
    return { synced: true, locked: false };
  } catch {
    writeLocal(PENDING_KEY, payload);
    return { synced: false, locked: false };
  }
}

/** Flush a queued offline save. No-op when there is nothing waiting. */
export async function flushPending() {
  const pending = readLocal(PENDING_KEY);
  if (!pending) return { synced: true, locked: false };
  return saveData(pending);
}

/**
 * Verify a passcode. Hits the auth-only endpoint, which does not read from
 * storage — so a broken GitHub token cannot be reported as a wrong passcode.
 * @returns {Promise<{ok: boolean, reason: "ok"|"wrong-passcode"|"server"|"offline", message: string}>}
 */
export async function checkPasscode(candidate) {
  try {
    const res = await fetch("/api/data?check=1", {
      headers: { "Content-Type": "application/json", "x-roadmap-key": candidate },
      cache: "no-store",
    });

    if (res.ok) return { ok: true, reason: "ok", message: "" };

    if (res.status === 401) {
      return { ok: false, reason: "wrong-passcode", message: "Incorrect passcode" };
    }

    const body = await res.json().catch(() => ({}));
    return {
      ok: false,
      reason: "server",
      message: body.hint || body.error || `Server error (${res.status})`,
    };
  } catch {
    return { ok: false, reason: "offline", message: "Can't reach the server. Check your connection." };
  }
}
