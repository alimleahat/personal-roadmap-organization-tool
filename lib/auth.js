// Passcode check for the data API.
//
// The deployed URL is public, so every request must carry the passcode. This is
// deliberately the smallest thing that works: one shared secret, no accounts,
// no third-party auth. Compared in constant time so the check can't be probed
// character by character.

import crypto from "crypto";

export const HEADER = "x-roadmap-key";

export function authorize(req) {
  // Read lazily: Vite loads .env after imports are hoisted.
  // Trimmed because pasting a value into a hosting dashboard very easily
  // carries a trailing newline or space, which would otherwise reject the
  // correct passcode with no way to tell why.
  const passcode = process.env.ROADMAP_PASSCODE?.trim();

  // No passcode configured means local development: allow through rather than
  // locking the developer out of their own machine.
  if (!passcode) return { ok: true };

  const raw = req.headers?.[HEADER] ?? req.headers?.get?.(HEADER);
  const supplied = typeof raw === "string" ? raw.trim() : raw;
  if (typeof supplied !== "string" || supplied.length === 0) {
    return { ok: false, status: 401, message: "Passcode required" };
  }

  const a = Buffer.from(supplied);
  const b = Buffer.from(passcode);
  const match = a.length === b.length && crypto.timingSafeEqual(a, b);

  return match ? { ok: true } : { ok: false, status: 401, message: "Incorrect passcode" };
}
