import { useState } from "react";
import { checkPasscode, setPasscode } from "../api";
import { themes, inp } from "../constants";

// Shown when the server rejects the stored passcode. The deployed URL is
// public, so this is what stands between the internet and your roadmap.
export default function PasscodeGate({ onUnlock }) {
  const t = themes.dark;
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!value || checking) return;

    setChecking(true);
    setError("");

    const result = await checkPasscode(value);
    if (result.ok) {
      setPasscode(value);
      onUnlock();
    } else {
      // Report what actually went wrong. A storage or network failure is not
      // the user mistyping, and saying so sends them hunting the wrong thing.
      setError(result.message);
      setChecking(false);
    }
  };

  return (
    <div style={{
      minHeight: "100dvh", background: t.bg, color: t.text,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 320 }}>
        <div style={{ fontSize: 10, color: t.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Roadmap</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, marginBottom: 20 }}>Enter passcode</div>

        <input
          type="password"
          inputMode="text"
          autoComplete="current-password"
          autoFocus
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          placeholder="Passcode"
          style={{ ...inp(t), fontSize: 16, padding: "12px 14px" }}
        />

        {error && (
          <div style={{ color: t.danger, fontSize: 12, marginBottom: 10 }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={!value || checking}
          style={{
            width: "100%", padding: "12px", borderRadius: 8,
            background: t.accent, color: t.accentText,
            fontSize: 14, fontWeight: 700, textAlign: "center",
            opacity: !value || checking ? 0.4 : 1,
            fontFamily: "inherit",
          }}
        >
          {checking ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
